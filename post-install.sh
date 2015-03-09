#!/bin/bash
rsync -a WebApp ../WebAppDIRAC
# vzn = verbose, compress, dry
# change web.cfg
cd ../WebAppDIRAC/WebApp
#mv web.cfg web.cfg.bck
#cat web.cfg.bck | sed -e "s|DIRAC = link.*|Projects\n    {\n        KosmoUI = DIRAC\.Cosmomc\n    }\n\n    DIRAC = link\|http://diracgrid.org|" > web.cfg
sed -i -e "s#DIRAC = link.*#Projects\n    {\n        KosmoUI = DIRAC\.Cosmomc\n    }\n\n    DIRAC = link\|http://diracgrid.org#" web.cfg
