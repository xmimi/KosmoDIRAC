from WebAppDIRAC.Lib.WebHandler import WebHandler, WErr, WOK, asyncGen
from DIRAC.Core.Base import Script
Script.parseCommandLine( ignoreErrors = True )
from DIRAC.Core.Security.X509Chain                       import X509Chain
from DIRAC.Core.Security                                 import Locations
from DIRAC.Interfaces.API.Dirac import Dirac
from DIRAC.Core.DISET.RPCClient import RPCClient
from DIRAC.Core.Utilities.Time import toString, date, day
from DIRAC import S_OK, S_ERROR
import json, os, shutil, re, ast, time, random, tarfile, mimetypes, base64, zipfile
import DIRAC

#root='/esr/user'        #dirac filecatalogue structure
batch='/include'
inidir='/ini'
outdir= '/output'
kosmoui='/kosmoui'      #project family dir
jdlfile='/job.jdl'
diracRoot=os.path.dirname(os.path.dirname( os.path.realpath(".." ) ))
cmddir=diracRoot + "/" + "pro/scripts"
dirac = Dirac()

class KosmoUIHandler(WebHandler):

    AUTH_PROPS = "authenticated"
    
    cosmodir='/cosmomc'     #project name
    tmpdir='/tmp/cosmomc'   #tmp directory local machine

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
        obj = ' '
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
            incl = self.get_argument('incl','')
            pro = self.get_argument('proj','')
            if pro:
                self.cosmodir='/'+pro
                self.tmpdir='/tmp/'+pro+str(time.time())+str(random.random())
                if not incl:
                    print 'load include pack '+pro
                    RPC = RPCClient( "DataManagement/FileCatalog" )
                    dir = self.__projectHome()+batch
                    result = RPC.listDirectory(dir, True)
                    obj = '[ '
                    for i in result['Value']['Successful'][dir]['Files'].keys(): #os.listdir(inipath):
                        obj+='{"inclfile":"'+i.split('/')[-1]+'"} ,'
                    obj = obj[:-1]
                    obj+=']'
                    self.write(obj)
                else:
                    from DIRAC.DataManagementSystem.Client.DataManager import DataManager
                    dataMgr = DataManager( vo = self.__getVO() )
                    if not os.path.isdir(self.tmpdir): os.makedirs(self.tmpdir)
                    result = dataMgr.getFile(str(self.__projectHome()+batch+'/'+incl), destinationDir=str(self.tmpdir) )
                    obj = ''
                    if result["OK"]:
                        tar = tarfile.open(self.tmpdir+'/'+incl)
                        tar.extractall(self.tmpdir)
                        obj =  '{"children":['
                        obj+= self.dir_walkthrough(self.tmpdir+'/'+os.path.splitext(incl)[0]+'/')
                        obj+= ']}'
                        tar.close()
                        shutil.rmtree(self.tmpdir)
                    self.write(obj)
            #else:
                #self.write('')

    def web_getIni(self):
        if self.__userVerify():
            name = self.get_argument('name','')
            pro = self.get_argument('proj','')
            if pro:
                self.cosmodir='/'+pro
                self.tmpdir='/tmp/'+pro+str(time.time())+str(random.random())
                if not name:
                    RPC = RPCClient( "DataManagement/FileCatalog" )
                    dir = self.__projectHome()+inidir
                    result = RPC.listDirectory(dir, True)
                    obj = '[ '
                    for i in result['Value']['Successful'][dir]['Files'].keys(): #os.listdir(inipath):
                        obj+='{"inifile":"'+i.split('/')[-1][:-4]+'"} ,'
                    obj = obj[:-1]
                    obj+=']'
                    self.write(obj)
                else:
                    #tmp = str(time.time())+str(random.random())
                    from DIRAC.DataManagementSystem.Client.DataManager import DataManager
                    dataMgr = DataManager( vo = self.__getVO() )
                    if not os.path.isdir(self.tmpdir): os.makedirs(self.tmpdir)
                    result = dataMgr.getFile(str(self.__projectHome()+inidir+'/'+str(name)+'.ini'), destinationDir=str(self.tmpdir) )
                    f= (open(self.tmpdir+'/'+name+'.ini','r'))
                    obj = ''
                    for i in f:
                        if i.rstrip() and not i.startswith('#'):
                            obj+=i
                    os.remove(self.tmpdir+'/'+name+'.ini')
                    if not os.listdir(self.tmpdir): os.rmdir(self.tmpdir)
                    self.write(obj)

    def web_proj(self):
        if self.__userVerify():
            pro = self.get_argument('proj','')
            if pro:
                self.cosmomc='/'+pro
                self.tmpdir='/tmp/'+pro+str(time.time())+str(random.random())
            else:
                RPC = RPCClient( "DataManagement/FileCatalog" )
                username = str(self.getSessionData()["user"]["username"])
                self.root='/'+self.__getVO()+'/user'
                dir = self.root+'/'+username[0:1]+'/'+username+kosmoui
                result = RPC.listDirectory(dir, True)
                #print result
                obj = '[ '
                for i in result['Value']['Successful'][dir]['SubDirs'].keys(): #os.listdir(inipath):
                    obj+='{"proj":"'+i.split('/')[-1]+'"} ,'
                obj = obj[:-1]
                obj+=']'
                self.write(obj)
    
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
            pro = self.get_argument('proj','')
            if cmd and name and pro:
                self.cosmodir='/'+pro
                self.tmpdir='/tmp/'+pro+str(time.time())+str(random.random())
                if not os.path.isdir(self.tmpdir): os.makedirs(self.tmpdir)
                if (cmd == 'new'):
                    from DIRAC.DataManagementSystem.Client.DataManager import DataManager
                    dataMgr = DataManager( vo = self.__getVO() )
                    f = open(self.tmpdir+'/'+name+'.ini','w')
                    f.write('\0')
                    f.close()
                    result = dataMgr.putAndRegister(str(self.__projectHome()+inidir+'/'+str(name)+'.ini'),str(self.tmpdir+'/'+str(name)+'.ini'),'DIRAC-USER' )
                    os.remove(self.tmpdir+'/'+name+'.ini')
                elif (cmd == 'del'):
                    from DIRAC.DataManagementSystem.Client.DataManager import DataManager
                    dataMgr = DataManager( vo = self.__getVO() )
                    result = dataMgr.removeFile(str(self.__projectHome()+inidir+'/'+str(name)+'.ini') )
                elif (cmd == 'dup'):
                    dst = self.get_argument('dst','')
                    from DIRAC.DataManagementSystem.Client.DataManager import DataManager
                    dataMgr = DataManager( vo = self.__getVO() )
                    result = dataMgr.getFile(str(self.__projectHome()+inidir+'/'+str(name)+'.ini'), destinationDir=str(self.tmpdir) )
                    result = dataMgr.putAndRegister(str(self.__projectHome()+inidir+'/'+str(dst)+'.ini'),str(self.tmpdir+'/'+name+'.ini'),'DIRAC-USER' )
                    os.remove(self.tmpdir+'/'+name+'.ini')
                if not os.listdir(self.tmpdir): os.rmdir(self.tmpdir)

    def web_jdl(self):
        if self.__userVerify():
            pro = self.get_argument('proj','')
            if pro:
                self.cosmodir='/'+pro
                self.tmpdir='/tmp/'+pro+str(time.time())+str(random.random())
                from DIRAC.DataManagementSystem.Client.DataManager import DataManager
                dataMgr = DataManager( vo = self.__getVO() )
                if not os.path.isdir(self.tmpdir): os.makedirs(self.tmpdir)
                result = dataMgr.getFile(str(self.__projectHome()+jdlfile), destinationDir=str(self.tmpdir))
                #print self.tmpdir
                #print os.path.isdir(self.tmpdir)
                #print type(str(self.__projectHome()+jdlfile))
                #print result

                obj = '[ '
                f=open(self.tmpdir+jdlfile,'r')
                for line in f:
                    l = line.split('=')
                    obj+='{"name":"'+l[0].strip()+'","value":"'+l[1].replace(';\n','').replace('"','\\"').strip()+'"},'
                obj = obj[:-1]+']'
                os.remove(self.tmpdir+jdlfile)
                if not os.listdir(self.tmpdir): os.rmdir(self.tmpdir)
                self.write(obj)

    def web_updateJdl(self):
        if self.__userVerify():
            pro = self.get_argument('proj','')
            if pro:
                self.cosmodir='/'+pro
                self.tmpdir='/tmp/'+pro+str(time.time())+str(random.random())
                from DIRAC.DataManagementSystem.Client.DataManager import DataManager
                dataMgr = DataManager( vo = self.__getVO() )
                if not os.path.isdir(self.tmpdir): os.makedirs(self.tmpdir)
                result = dataMgr.getFile(str(self.__projectHome()+jdlfile), destinationDir=self.tmpdir )
                f=open(self.tmpdir+jdlfile,'w')
                for i in self.request.body:
                    f.write(i.replace('\n',';\n'))
                f.close()
                result = dataMgr.removeFile(str(self.__projectHome()+jdlfile) )
                result = dataMgr.putAndRegister(str(self.__projectHome()+jdlfile),str(self.tmpdir+jdlfile),'DIRAC-USER' ) 
                os.remove(self.tmpdir+jdlfile)
                if not os.listdir(self.tmpdir): os.rmdir(self.tmpdir)

    def web_sendJob(self):
        if self.__userVerify():
            arg = self.get_argument('inifile','')
            pro = self.get_argument('proj','')
            if pro:
                self.cosmodir='/'+pro
                self.tmpdir='/tmp/'+pro+str(time.time())+str(random.random())
                if arg:
                    from DIRAC.DataManagementSystem.Client.DataManager import DataManager
                    dataMgr = DataManager( vo = self.__getVO() )
                    if not os.path.isdir(self.tmpdir): os.makedirs(self.tmpdir)
                    result = dataMgr.getFile(str(self.__projectHome()+jdlfile), destinationDir=str(self.tmpdir) )
                    from DIRAC.WorkloadManagementSystem.Client.WMSClient import WMSClient
                    jm = WMSClient(useCertificates=True, timeout = 1800 )
                    ret = jm.submitJob(open(self.tmpdir+jdlfile,'r').read())
                    os.remove(self.tmpdir+jdlfile)
                    if not os.listdir(self.tmpdir): os.rmdir(self.tmpdir)

                    if ret["OK"]:
                        self.write("Successful, " + str(len(ret["Value"]))+" job(s) sent")
                    else:
                        self.write(str(ret["Message"]))

    def web_updateIni(self):
        if self.__userVerify():
            file = self.get_argument('name','')
            pro = self.get_argument('proj','')
            if pro:
                self.cosmodir='/'+pro
                self.tmpdir='/tmp/'+pro+str(time.time())+str(random.random())
                if file:
                    from DIRAC.DataManagementSystem.Client.DataManager import DataManager
                    dataMgr = DataManager( vo = self.__getVO() )
                    if not os.path.isdir(self.tmpdir): os.makedirs(self.tmpdir)
                    result = dataMgr.getFile(self.__projectHome()+inidir+'/'+str(file)+'.ini', destinationDir=self.tmpdir )
                    f=open(self.tmpdir+'/'+file+'.ini','w')
                    for i in self.request.body:
                        f.write(i)
                    f.close()
                    result = dataMgr.removeFile(str(self.__projectHome()+inidir+'/'+str(file)+'.ini') )
                    print result
                    result = dataMgr.putAndRegister(str(self.__projectHome()+inidir+'/'+str(file)+'.ini'),str(self.tmpdir+'/'+str(file)+'.ini'),'DIRAC-USER' ) 
                    print result
                    os.remove(self.tmpdir+'/'+file+'.ini')
                    if not os.listdir(self.tmpdir): os.rmdir(self.tmpdir)

    def web_joblist(self):
        if self.__userVerify():
            ret = self.__getGroupList()
            if ret["OK"]:
                obj = '[ '
                for i in ret["Value"]:
                    obj+='{"job":"'+i.strip()+'"},'
                self.write(obj[:-1]+']')
            else:
                self.write('[{"job":"' + ret['Message'] + '"}]')
      
    def web_datalist(self):
        if self.__userVerify():
            pro = self.get_argument('proj','')
            if pro:
                self.cosmodir='/'+pro
                self.tmpdir='/tmp/'+pro+str(time.time())+str(random.random())
                RPC = RPCClient( "DataManagement/FileCatalog" )
                dir = self.__projectHome()+outdir
                result = RPC.listDirectory(dir, True)
                obj = '[ '
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
            pro = self.get_argument('proj','')
            if pro:
                self.cosmodir='/'+pro
                self.tmpdir='/tmp/'+pro+str(time.time())+str(random.random())
                folder = self.get_argument('folder','')
                dir = self.__projectHome()+outdir+'/'+str(folder)
                obj = '[ '
                obj += self.datatree_rec(dir)
                obj+=']'
                self.write(obj)
     
    def web_status(self):
        if self.__userVerify():
            pro = self.get_argument('proj','')
            if pro:
                self.cosmodir='/'+pro
                self.tmpdir='/tmp/'+pro+str(time.time())+str(random.random())
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
            pro = self.get_argument('proj','')
            if pro:
                self.cosmodir='/'+pro
                self.tmpdir='/tmp/'+pro+str(time.time())+str(random.random())
                p = self.get_argument('path','')
                dir = self.__projectHome()+outdir+str(p)
                RPC = RPCClient( "DataManagement/FileCatalog" )
                if RPC.isFile(dir)['Value']['Successful'][dir]:
                    result = RPC.getFileMetadata(dir)
                    if result['Value']['Successful'][dir]['Size']<600000 :
                        from DIRAC.DataManagementSystem.Client.DataManager import DataManager
                        dataMgr = DataManager( vo = self.__getVO() )
                        if not os.path.isdir(self.tmpdir): os.makedirs(self.tmpdir)
                        result = dataMgr.getFile(str(dir), destinationDir=str(self.tmpdir) )
                        mime = mimetypes.guess_type(self.tmpdir+'/'+dir.split('/')[-1])
                        f = open(self.tmpdir+'/'+dir.split('/')[-1],'rb')
                        if (mime[0] and mime[0].split('/')[0]=='text') or (not mime[0] and not mime[1]):
                            self.write(f.read().replace('\n','<br>'))
                        elif mime[0] and mime[0].split('/')[0]=='image':
                            self.write('<div style="height:100%; width:100%;text-align:center; vertical-align:middle;"><img style="max-height:100%; max-width:100%;" src="data:'+mime[0]+';base64,'+base64.b64encode(f.read())+'"/></div>')
                        else:
                            self.write('<div style="text-align:center; vertical-align:middle;">no displayable content</div>')
                        f.close()
                        os.remove(self.tmpdir+'/'+dir.split('/')[-1])
                        if not os.listdir(self.tmpdir): os.rmdir(self.tmpdir)
                    else:
                        self.write('<div style="text-align:center; vertical-align:middle;">'+str(dir)+' is too big for preview</div>')
                else:
                    self.write('<div style="text-align:center; vertical-align:middle;">cannot display content of '+str(dir)+'</div>')

    def get_rec(self,path,dir):
        RPC = RPCClient( "DataManagement/FileCatalog" )
        result = RPC.listDirectory(path, True)
        for i in result['Value']['Successful'][path]['Files'].keys():
            from DIRAC.DataManagementSystem.Client.DataManager import DataManager
            dataMgr = DataManager( vo = self.__getVO() )
            res = dataMgr.getFile(str(path+'/'+i.split('/')[-1]), destinationDir=str(dir) )
        for i in result['Value']['Successful'][path]['SubDirs'].keys():
            os.makedirs(dir+'/'+i.split('/')[-1])
            self.get_rec(i,dir+'/'+i.split('/')[-1])

    def web_get(self):
        if self.__userVerify():
            p = self.get_argument('path','')
            pro = self.get_argument('proj','')
            if pro:
                self.cosmodir='/'+pro
                self.tmpdir='/tmp/'+pro+str(time.time())+str(random.random())
                dir = self.__projectHome()+outdir+str(p)
                RPC = RPCClient( "DataManagement/FileCatalog" )
                obj = ''
                if RPC.isFile(dir)['Value']['Successful'][dir]:
                    from DIRAC.DataManagementSystem.Client.DataManager import DataManager
                    dataMgr = DataManager( vo = self.__getVO() )
                    if not os.path.isdir(self.tmpdir): os.makedirs(self.tmpdir)
                    result = dataMgr.getFile(str(dir), destinationDir=str(self.tmpdir) )
                    f = open(self.tmpdir+'/'+dir.split('/')[-1],'rb')
                    obj = f.read()
                    f.close()
                    os.remove(self.tmpdir+'/'+dir.split('/')[-1])
                    if not os.listdir(self.tmpdir): os.rmdir(self.tmpdir)
                    self.set_header('Content-Disposition', 'attachment; filename="'+dir.split('/')[-1]+'"')
                else:
                    if not os.path.isdir(self.tmpdir): os.makedirs(self.tmpdir)
                    #walkthrough path
                    os.makedirs(self.tmpdir+'/'+dir.split('/')[-1])
                    self.get_rec(dir,self.tmpdir+'/'+dir.split('/')[-1])
                    #make zip file
                    zf = zipfile.ZipFile(self.tmpdir+'/'+dir.split('/')[-1]+'.zip', "w")
                    os.chdir(self.tmpdir)
                    for dirname, subdirs, files in os.walk(dir.split('/')[-1]):
                        zf.write(dirname)
                        for filename in files:
                            zf.write(os.path.join(dirname, filename))
                    zf.close()
                    #read zip file
                    f = open(self.tmpdir+'/'+dir.split('/')[-1]+'.zip','rb')
                    obj = f.read()
                    f.close()
                    #cleanup
                    shutil.rmtree(self.tmpdir+'/'+dir.split('/')[-1])
                    os.remove(self.tmpdir+'/'+dir.split('/')[-1]+'.zip')
                    if not os.listdir(self.tmpdir): os.rmdir(self.tmpdir)
                    self.set_header('Content-Disposition', 'attachment; filename="'+dir.split('/')[-1]+'.zip"')
            
                self.write(obj)

    def rmtree_rec(self, path):
        RPC = RPCClient( "DataManagement/FileCatalog" )
        result = RPC.listDirectory(path, True)
        from DIRAC.DataManagementSystem.Client.DataManager import DataManager
        dataMgr = DataManager( vo = self.__getVO() )
        for i in result['Value']['Successful'][path]['SubDirs'].keys():
            self.rmtree_rec(path+'/'+i.split('/')[-1])
        for i in result['Value']['Successful'][path]['Files'].keys():
            res = dataMgr.removeFile(str(path+'/'+i.split('/')[-1]))
        RPC.removeDirectory(str(path))

    def web_rmtree(self):
        if self.__userVerify():
            p = self.get_argument('path','')
            pro = self.get_argument('proj','')
            if pro:
                self.cosmodir='/'+pro
                self.tmpdir='/tmp/'+pro+str(time.time())+str(random.random())
                dir = self.__projectHome()+outdir+str(p)
                RPC = RPCClient( "DataManagement/FileCatalog" )
                obj = ''
                if RPC.isFile(dir)['Value']['Successful'][dir]:
                    from DIRAC.DataManagementSystem.Client.DataManager import DataManager
                    dataMgr = DataManager( vo = self.__getVO() )
                    result = dataMgr.removeFile(str(dir))
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
        self.root='/'+self.__getVO()+'/user'
        return self.root+'/'+username[0:1]+'/'+username+kosmoui+self.cosmodir

    def __getUserName(self, secondsOverride=None):
        #proxyManager = ProxyManagerClient()
        userData = self.getSessionData()
        userName = str(userData["user"]["username"])
        userGroup = str(userData["user"]["group"])
        if userGroup == "visitor":
            return ""
        else:
            return userName

    def __getVO(self, secondsOverride=None):
        #proxyManager = ProxyManagerClient()
        userData = self.getSessionData()
        userGroup = str(userData["user"]["group"])
        if userGroup == "visitor": 
            return ""
        else:
            from DIRAC.ConfigurationSystem.Client.Helpers.Registry import getVOForGroup
            voName = getVOForGroup(userGroup )
            return voName

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
