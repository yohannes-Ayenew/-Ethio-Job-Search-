@echo off
cd "c:\Projects\mini apps\-Ethio-Job-Search-"
echo Running scheduled auto-push...

git add .
git commit -m "chore: automated scheduled push"
git push

echo Done!
