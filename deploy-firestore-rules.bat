@echo off
echo Deploying Firestore security rules...
echo.
firebase deploy --only firestore:rules
echo.
echo Done! Dev tasks collections (dev_tasks, dev_persons) are now accessible.
pause
