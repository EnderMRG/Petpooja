@echo off
cd /d f:\Petpooja
python generate_ppt.py > ppt_log.txt 2>&1
echo Done creating pptx
