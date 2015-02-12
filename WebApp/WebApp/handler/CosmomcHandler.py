from WebAppDIRAC.Lib.WebHandler import WebHandler, WErr, WOK, asyncGen
from DIRAC.Core.Base import Script
Script.parseCommandLine( ignoreErrors = True )
from DIRAC.Core.Security.X509Chain                       import X509Chain
from DIRAC.Core.Security                                 import Locations
from DIRAC.Interfaces.API.Dirac import Dirac
from DIRAC.FrameworkSystem.Client.ProxyManagerClient import ProxyManagerClient
from DIRAC.Core.DISET.RPCClient import RPCClient
from DIRAC.Core.Utilities.Time import toString, date, day
from DIRAC import S_OK, S_ERROR
import json, os, shutil, re, ast, time, random, tarfile, mimetypes, base64, zipfile
import DIRAC

root='/esr/user'
cosmodir='/cosmomc'
batch='/include/batch1.gz'
inidir='/ini'
outdir= '/output'
jdlfile='/job.jdl'
tmpdir='/tmp/cosmomc'
diracRoot=os.path.dirname(os.path.dirname( os.path.realpath(".." ) ))
cmddir=diracRoot + "/" + "pro/scripts"
dirac = Dirac()

class CosmomcHandler(WebHandler):

    AUTH_PROPS = "authenticated"

    def web_getData(self):
        #obj = {"ini":"test.ini","jdl":"synthese.jdl"}
        #self.write(json_encode(obj))
        self.write({"data":"coucou","ini":"test.ini","jdl":"synthese.jdl"})

    def ini_walkthrough(self, file):
        obj = ''
        ini = open(file,'r')
        for line in ini:
            l= line.strip()
            if l.rstrip() and not l.startswith('#'):
                if not l.startswith('INCLUDE') and not l.startswith('DEFAULT'):
                    obj+='{"name" : "'+l.split('=')[0].strip()+'" ,"value" : "'+l.split('=')[1].strip()+'" ,"leaf" : "true"} ,'
                else:
                    obj+='{"name" : "'+l.strip()+'" ,"value" : "" ,"leaf" : "true"} ,'
        obj = obj[:-1]
        return obj

    def dir_walkthrough(self, path):
        obj = ''
        for file in os.listdir(path):
            if not os.path.isdir(path+file):
                if (path+file)[-4:]==".ini":
                    obj+='{"name":"'+file[:-4]+'","checked":false,"children":['
                    obj+=self.ini_walkthrough(path+file)
                    obj+=']},'
            else:
                #obj+='{"name":"'+file+'","expanded":true,"children":['
                obj+='{"name":"'+file+'","children":['
                obj+=self.dir_walkthrough(path+file+'/')
                obj+=']},'
        obj = obj[:-1]
        return obj

  
    def web_getIncl(self):
        if self.__userVerify():
            from DIRAC.DataManagementSystem.Client.DataManager import DataManager
            dataMgr = DataManager( vo = 'esr' )
            if not os.path.isdir(tmpdir): os.makedirs(tmpdir)
            result = dataMgr.getFile(self.__projectHome()+batch, destinationDir=tmpdir )
            tar = tarfile.open(tmpdir+'/'+batch.split('/')[-1])
            tar.extractall(tmpdir)
            obj =  '{"children":['
            #obj =  '{"text":".","children":['
            obj+= self.dir_walkthrough(tmpdir+'/batch1/')
            obj+= ']}'
            tar.close()
            shutil.rmtree(tmpdir+'/batch1/')
            os.remove(tmpdir+'/'+batch.split('/')[-1])
            if not os.listdir(tmpdir): os.rmdir(tmpdir)
            self.write(obj)

    def web_getIni(self):
        if self.__userVerify():
            name = self.get_argument('name','')
            if not name:
                RPC = RPCClient( "DataManagement/FileCatalog" )
                dir = self.__projectHome()+inidir
                result = RPC.listDirectory(dir, True)
                obj = '['
                for i in result['Value']['Successful'][dir]['Files'].keys(): #os.listdir(inipath):
                    obj+='{"inifile":"'+i.split('/')[-1][:-4]+'"} ,'
                obj = obj[:-1]
                obj+=']'
                self.write(obj)
            else:
                #tmp = str(time.time())+str(random.random())
                from DIRAC.DataManagementSystem.Client.DataManager import DataManager
                dataMgr = DataManager( vo = 'esr' )
                if not os.path.isdir(tmpdir): os.makedirs(tmpdir)
                result = dataMgr.getFile(self.__projectHome()+inidir+'/'+str(name)+'.ini', destinationDir=tmpdir )
                f= (open(tmpdir+'/'+name+'.ini','r'))
                obj = ''
                for i in f:
                    if i.rstrip() and not i.startswith('#'):
                        obj+=i
                os.remove(tmpdir+'/'+name+'.ini')
                if not os.listdir(tmpdir): os.rmdir(tmpdir)
                self.write(obj)

    def web_ping(self):
        pingValue = self.request.arguments["ping_val"][0]
        self.write({"pong_val": pingValue})
    
    def web_diracDo(self):
        if self.__userVerify():
            cmd = self.get_argument('cmd','')
            name = self.get_argument('name','')
            if cmd and name:
                if (cmd == 'summary'):
                    ids = self.__getIds(name)
                    if (len(ids) != 0):
                        ret = self.__getStatus(ids)
                        a = ret["Value"]
                        s = ""
                        for i in ids:
                            id=int(i)
                            s += a[id]['Status']
                        obj = ""
                        obj+=str(s.count('Received'))+" Received\n"
                        obj+=str(s.count('Stalled'))+" Stalled\n"
                        obj+=str(s.count('Marched'))+" Marched\n"
                        obj+=str(s.count('Checking'))+" Checking\n"
                        obj+=str(s.count('Cleared'))+" Cleared\n"
                        obj+=str(s.count('Killed'))+" Killed\n"
                        obj+=str(s.count('Rescheduled'))+" Rescheduled\n"
                        obj+=str(s.count('Failed'))+" Failed\n"
                        obj+=str(s.count('Waiting'))+" Waiting\n"
                        obj+=str(s.count('Done'))+" Done\n"
                        obj+=str(s.count('Running'))+" Running\n"
                        obj+=str(s.count('Deleted'))+" Deleted\n"
                        obj+=str(s.count('Completed'))+" Completed\n"
                        obj = re.sub(re.compile('^0.*\n',re.MULTILINE),'',obj)
                        self.write(obj)
                    else:
                        self.write("Group <b>"+name+"</b> does not exist\n")
                elif (cmd == 'detail'):
                    ids = self.__getIds(name)
                    if (len(ids) != 0):
                        ret = self.__getStatus(ids)
                        a = ret["Value"]
                        s = "<table >"
                        for i in ids:
                            id=int(i)
                            line = "<tr><td>"+("%6d"%id)+"</td><td>"+"&nbsp;"*6+"</td><td>"+(a[id]['Status'])+"</td><td>"+"&nbsp;"*6+"</td><td>"+(a[id]['MinorStatus'])+"</td><td>"+"&nbsp;"*6+"</td><td>"+a[id]['Site']+"</td></tr>"
                            s+=line
                        self.write(s+"</table>")
                    else:
                        self.write("Group <b>"+name+"</b> does not exist\n")
                elif (cmd == 'delete'):
                    ids = self.__getIds(name)
                    if (len(ids) != 0):
                        ret = self.__deleteJob(ids)
                        if ret["OK"]:
                            self.write(" Group "+name+" deleted\n")
                        else:
                            self.write(ret["Value"])
                    else:
                        self.write("Group <b>"+name+"</b> does not exist\n")

    def web_manageFile(self):
        if self.__userVerify():
            cmd = self.get_argument('do','')
            name = self.get_argument('name','')
            if cmd and name:
                if not os.path.isdir(tmpdir): os.makedirs(tmpdir)
                if (cmd == 'new'):
                    from DIRAC.DataManagementSystem.Client.DataManager import DataManager
                    dataMgr = DataManager( vo = 'esr' )
                    f = open(tmpdir+'/'+name+'.ini','w')
                    f.write('\0')
                    f.close()
                    result = dataMgr.putAndRegister(self.__projectHome()+inidir+'/'+str(name)+'.ini',tmpdir+'/'+str(name)+'.ini','DIRAC-USER' )
                    os.remove(tmpdir+'/'+name+'.ini')
                elif (cmd == 'del'):
                    from DIRAC.DataManagementSystem.Client.DataManager import DataManager
                    dataMgr = DataManager( vo = 'esr' )
                    result = dataMgr.removeFile(self.__projectHome()+inidir+'/'+str(name)+'.ini' )
                    #os.remove(inipath+name+'.ini')
                elif (cmd == 'dup'):
                    dst = self.get_argument('dst','')
                    from DIRAC.DataManagementSystem.Client.DataManager import DataManager
                    dataMgr = DataManager( vo = 'esr' )
                    result = dataMgr.getFile(self.__projectHome()+inidir+'/'+str(name)+'.ini', destinationDir=tmpdir )
                    #shutil.copy(inipath+name+'.ini', inipath+dst+'.ini')
                    result = dataMgr.putAndRegister(self.__projectHome()+inidir+'/'+str(dst)+'.ini',tmpdir+'/'+str(name)+'.ini','DIRAC-USER' )
                    os.remove(tmpdir+'/'+name+'.ini')
                if not os.listdir(tmpdir): os.rmdir(tmpdir)

    def web_jdl(self):
        if self.__userVerify():
            from DIRAC.DataManagementSystem.Client.DataManager import DataManager
            dataMgr = DataManager( vo = 'esr' )
            if not os.path.isdir(tmpdir): os.makedirs(tmpdir)
            result = dataMgr.getFile(self.__projectHome()+jdlfile, destinationDir=tmpdir )
            obj = '['
            f=open(tmpdir+jdlfile,'r')
            for line in f:
                l = line.split('=')
                obj+='{"name":"'+l[0].strip()+'","value":"'+l[1].replace(';\n','').replace('"','\\"').strip()+'"},'
            obj = obj[:-1]+']'
            os.remove(tmpdir+jdlfile)
            if not os.listdir(tmpdir): os.rmdir(tmpdir)
            self.write(obj)

    def web_updateJdl(self):
        if self.__userVerify():
            from DIRAC.DataManagementSystem.Client.DataManager import DataManager
            dataMgr = DataManager( vo = 'esr' )
            if not os.path.isdir(tmpdir): os.makedirs(tmpdir)
            result = dataMgr.getFile(self.__projectHome()+jdlfile, destinationDir=tmpdir )
            f=open(tmpdir+jdlfile,'w')
            for i in self.request.body:
                f.write(i.replace('\n',';\n'))
            f.close()
            result = dataMgr.removeFile(self.__projectHome()+jdlfile )
            result = dataMgr.putAndRegister(self.__projectHome()+jdlfile,tmpdir+jdlfile,'DIRAC-USER' ) 
            os.remove(tmpdir+jdlfile)
            if not os.listdir(tmpdir): os.rmdir(tmpdir)

    def web_sendJob(self):
        if self.__userVerify():
            arg = self.get_argument('inifile','')
            if arg:
                from DIRAC.DataManagementSystem.Client.DataManager import DataManager
                dataMgr = DataManager( vo = 'esr' )
                if not os.path.isdir(tmpdir): os.makedirs(tmpdir)
                result = dataMgr.getFile(self.__projectHome()+jdlfile, destinationDir=tmpdir )
                from DIRAC.WorkloadManagementSystem.Client.WMSClient import WMSClient
                jm = WMSClient(useCertificates=True, timeout = 1800 )
                ret = jm.submitJob(open(tmpdir+jdlfile,'r').read())
                os.remove(tmpdir+jdlfile)
                if not os.listdir(tmpdir): os.rmdir(tmpdir)

                if ret["OK"]:
                    self.write("Successful, " + str(len(ret["Value"]))+" job(s) sent")
                else:
                    self.write(str(ret["Message"]))

    def web_updateIni(self):
        if self.__userVerify():
            file = self.get_argument('name','')
            if file:
                from DIRAC.DataManagementSystem.Client.DataManager import DataManager
                dataMgr = DataManager( vo = 'esr' )
                if not os.path.isdir(tmpdir): os.makedirs(tmpdir)
                result = dataMgr.getFile(self.__projectHome()+inidir+'/'+str(file)+'.ini', destinationDir=tmpdir )
                f=open(tmpdir+'/'+file+'.ini','w')
                for i in self.request.body:
                    f.write(i)
                f.close()
                result = dataMgr.removeFile(self.__projectHome()+inidir+'/'+str(file)+'.ini' )
                result = dataMgr.putAndRegister(self.__projectHome()+inidir+'/'+str(file)+'.ini',tmpdir+'/'+str(file)+'.ini','DIRAC-USER' ) 
                os.remove(tmpdir+'/'+file+'.ini')
                if not os.listdir(tmpdir): os.rmdir(tmpdir)

    def web_joblist(self):
        if self.__userVerify():
            ret = self.__getGroupList()
            if ret["OK"]:
                obj = '['
                for i in ret["Value"]:
                    obj+='{"job":"'+i.strip()+'"},'
                self.write(obj[:-1]+']')
            else:
                self.write('[{"job":"' + ret['Message'] + '"}]')
      
    def web_datalist(self):
        if self.__userVerify():
            RPC = RPCClient( "DataManagement/FileCatalog" )
            dir = self.__projectHome()+outdir
            result = RPC.listDirectory(dir, True)
            obj = '['
            for i in result['Value']['Successful'][dir]['SubDirs'].keys(): #os.listdir(inipath):
                obj+='{"data":"'+i.split('/')[-1]+'"} ,'
            obj = obj[:-1]
            obj+=']'
            self.write(obj)

    def datatree_rec(self, path):
        RPC = RPCClient( "DataManagement/FileCatalog" )
        result = RPC.listDirectory(path, True)
        obj = ''
        for i in result['Value']['Successful'][path]['SubDirs'].keys():
            obj+='{"label":"'+i.split('/')[-1]+'","children":['+self.datatree_rec(path+'/'+i.split('/')[-1])+'],"path":"'+path.split(outdir)[-1]+'"},'
        for i in result['Value']['Successful'][path]['Files'].keys():
            obj+='{"label":"'+i.split('/')[-1]+'","leaf":"true","path":"'+path.split(outdir)[-1]+'"},'
        obj = obj[:-1]
        return obj

    def web_datatree(self):
        if self.__userVerify():
            folder = self.get_argument('folder','')
            dir = self.__projectHome()+outdir+'/'+str(folder)
            obj = '['
            obj += self.datatree_rec(dir)
            obj+=']'
            self.write(obj)
     
    def web_status(self):
        if self.__userVerify():
            p = self.get_argument('path','')
            dir = self.__projectHome()+outdir+str(p)
            RPC = RPCClient( "DataManagement/FileCatalog" )
            if RPC.isFile(dir)['Value']['Successful'][dir]:
                result = RPC.getFileMetadata(dir)
                def date_handler(obj):
                    return obj.isoformat() if hasattr(obj, 'isoformat') else obj
                self.write(json.dumps(result['Value']['Successful'][dir], default=date_handler))
            else:
                self.write(str(dir)+" is a job directory")

    def web_preview(self):
        if self.__userVerify():
            p = self.get_argument('path','')
            dir = self.__projectHome()+outdir+str(p)
            RPC = RPCClient( "DataManagement/FileCatalog" )
            if RPC.isFile(dir)['Value']['Successful'][dir]:
                result = RPC.getFileMetadata(dir)
                if result['Value']['Successful'][dir]['Size']<600000 :
                    from DIRAC.DataManagementSystem.Client.DataManager import DataManager
                    dataMgr = DataManager( vo = 'esr' )
                    if not os.path.isdir(tmpdir): os.makedirs(tmpdir)
                    result = dataMgr.getFile(dir, destinationDir=tmpdir )
		    mime = mimetypes.guess_type(tmpdir+'/'+dir.split('/')[-1])
                    f = open(tmpdir+'/'+dir.split('/')[-1],'rb')
		    if (mime[0] and mime[0].split('/')[0]=='text') or (not mime[0] and not mime[1]):
                        self.write(f.read().replace('\n','<br>'))
		    elif mime[0] and mime[0].split('/')[0]=='image':
		        self.write('<div style="height:100%; width:100%;text-align:center; vertical-align:middle;"><img style="max-height:100%; max-width:100%;" src="data:'+mime[0]+';base64,'+base64.b64encode(f.read())+'"/></div>')
		    else:
                        self.write('<div style="text-align:center; vertical-align:middle;">no displayable content</div>')
                    f.close()
                    os.remove(tmpdir+'/'+dir.split('/')[-1])
                    if not os.listdir(tmpdir): os.rmdir(tmpdir)
                else:
                    self.write('<div style="text-align:center; vertical-align:middle;">'+str(dir)+' is too big for preview</div>')
            else:
                self.write('<div style="text-align:center; vertical-align:middle;">cannot display content of '+str(dir)+'</div>')

    def get_rec(self,path,dir):
        RPC = RPCClient( "DataManagement/FileCatalog" )
        result = RPC.listDirectory(path, True)
        for i in result['Value']['Successful'][path]['Files'].keys():
            from DIRAC.DataManagementSystem.Client.DataManager import DataManager
            dataMgr = DataManager( vo = 'esr' )
            res = dataMgr.getFile(path+'/'+i.split('/')[-1], destinationDir=dir )
        for i in result['Value']['Successful'][path]['SubDirs'].keys():
            os.makedirs(dir+'/'+i.split('/')[-1])
            self.get_rec(i,dir+'/'+i.split('/')[-1])

    def web_get(self):
        if self.__userVerify():
            p = self.get_argument('path','')
            dir = self.__projectHome()+outdir+str(p)
            RPC = RPCClient( "DataManagement/FileCatalog" )
            obj = ''
            if RPC.isFile(dir)['Value']['Successful'][dir]:
                from DIRAC.DataManagementSystem.Client.DataManager import DataManager
                dataMgr = DataManager( vo = 'esr' )
                if not os.path.isdir(tmpdir): os.makedirs(tmpdir)
                result = dataMgr.getFile(dir, destinationDir=tmpdir )
                f = open(tmpdir+'/'+dir.split('/')[-1],'rb')
                obj = f.read()
                f.close()
                os.remove(tmpdir+'/'+dir.split('/')[-1])
                if not os.listdir(tmpdir): os.rmdir(tmpdir)
                self.set_header('Content-Disposition', 'attachment; filename="'+dir.split('/')[-1]+'"')
            else:
                if not os.path.isdir(tmpdir): os.makedirs(tmpdir)
                #walkthrough path
                os.makedirs(tmpdir+'/'+dir.split('/')[-1])
                self.get_rec(dir,tmpdir+'/'+dir.split('/')[-1])
                #make zip file
                zf = zipfile.ZipFile(tmpdir+'/'+dir.split('/')[-1]+'.zip', "w")
                os.chdir(tmpdir)
                for dirname, subdirs, files in os.walk(dir.split('/')[-1]):
                    zf.write(dirname)
                    for filename in files:
                        zf.write(os.path.join(dirname, filename))
                zf.close()
                #read zip file
                f = open(tmpdir+'/'+dir.split('/')[-1]+'.zip','rb')
                obj = f.read()
                f.close()
                #cleanup
                shutil.rmtree(tmpdir+'/'+dir.split('/')[-1])
                os.remove(tmpdir+'/'+dir.split('/')[-1]+'.zip')
                if not os.listdir(tmpdir): os.rmdir(tmpdir)
                self.set_header('Content-Disposition', 'attachment; filename="'+dir.split('/')[-1]+'.zip"')
            
            self.write(obj)

    def rmtree_rec(self, path):
        RPC = RPCClient( "DataManagement/FileCatalog" )
        result = RPC.listDirectory(path, True)
        from DIRAC.DataManagementSystem.Client.DataManager import DataManager
        dataMgr = DataManager( vo = 'esr' )
        for i in result['Value']['Successful'][path]['SubDirs'].keys():
            self.rmtree_rec(path+'/'+i.split('/')[-1])
        for i in result['Value']['Successful'][path]['Files'].keys():
            res = dataMgr.removeFile(path+'/'+i.split('/')[-1])
        RPC.removeDirectory(path)

    def web_rmtree(self):
        if self.__userVerify():
            p = self.get_argument('path','')
            dir = self.__projectHome()+outdir+str(p)
            RPC = RPCClient( "DataManagement/FileCatalog" )
            obj = ''
            if RPC.isFile(dir)['Value']['Successful'][dir]:
                from DIRAC.DataManagementSystem.Client.DataManager import DataManager
                dataMgr = DataManager( vo = 'esr' )
                result = dataMgr.removeFile(dir)
            else:
                self.rmtree_rec(dir)
        
    def __getIds(self, gname):
        uname = self.__getUserName()
        ret = dirac.selectJobs( jobGroup=gname, owner=uname, date='2014-01-01' )
        if ret["OK"]:
            return ret["Value"]
        else:
            return []

    def __getStatus(self, ids):
        return dirac.status(ids)

    def __deleteJob(self, ids):
        rpcJob = RPCClient("WorkloadManagement/JobManager")
        return rpcJob.deleteJob(ids)

    def __userVerify(self):
        RPC = RPCClient( "DataManagement/FileCatalog" )
        ret = RPC.isDirectory(self.__projectHome())
        if ret["OK"]:
            return True
        else:
            return False 

    def __projectHome(self):
        username = str(self.getSessionData()["user"]["username"])
        return root+'/'+username[0:1]+'/'+username+cosmodir

    def __getUserName(self, secondsOverride=None):
        proxyManager = ProxyManagerClient()
        userData = self.getSessionData()
        userName = str(userData["user"]["username"])
        userGroup = str(userData["user"]["group"])
        #userDN = str(userData["user"]["DN"])
        if userGroup == "visitor":
            return ""
        else:
            #print userData
            return userName

    def __getGroupList(self):
        uname = self.__getUserName()
        #from DIRAC.Core.Base import Script
        #Script.parseCommandLine( ignoreErrors = True )
        jobDate = toString( date() - 60 * day )
        conditions = {'Owner' : uname}
        rpcMoni = RPCClient("WorkloadManagement/JobMonitoring")
        ret = rpcMoni.getJobs( conditions, jobDate )
        if ret["OK"]:
            jobs = ret['Value']
            if (len(jobs) != 0):
                z = ast.literal_eval(rpcMoni.getJobsSummary( jobs )['Value'])
                filter = set()
                for i in jobs:
                    filter.add(z[int(i)]['JobGroup'])
                return S_OK( list(filter))
            else:
                return S_OK( {} )
        else:
            return S_ERROR(ret['Message'])
