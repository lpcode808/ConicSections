# Launch Checklist: GitHub Pages

Target repository:
- [lpcode808/ConicSections](https://github.com/lpcode808/ConicSections)

## 1) Initialize and push

Run from project root:

```bash
git init
git branch -M main
git add .
git commit -m "Initial conic sections explorable site"
git remote add origin https://github.com/lpcode808/ConicSections.git
git push -u origin main
```

## 2) Enable Pages

In GitHub repo settings:
1. Open **Settings > Pages**
2. Set source to **GitHub Actions**

## 3) Verify workflows

Expected workflows:
- `.github/workflows/deploy.yml` (publishes Pages)
- `.github/workflows/ux-tests.yml` (runs Playwright UX checks)

## 4) Post-launch smoke checks

After deploy, verify:
- landing page loads
- each module page opens
- debug panel appears
- URL state changes when controls are moved
- no console module/CORS errors on hosted URL
