@echo off
cd /d "d:\ai project\New folder\files\reskilling-platform-complete\CareerDev"
git add -A
git commit -m "feat: platform upgrade phases 1-6"
git push origin main
echo FRONTEND DONE
cd /d "d:\ai project\New folder\files\reskilling-platform-complete\reskilling-platform"
git add -A
git commit -m "feat: add analyse-jd, analyse-resume, market-pulse, org/skill-framework endpoints"
git push origin main
echo BACKEND DONE
