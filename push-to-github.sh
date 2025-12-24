#!/bin/bash

# Script to push PD Voice Detection project to GitHub
# Usage: ./push-to-github.sh

echo "🚀 Pushing PD Voice Detection to GitHub..."
echo ""

# Check if remote already exists
if git remote get-url origin > /dev/null 2>&1; then
    echo "Remote 'origin' already exists:"
    git remote get-url origin
    read -p "Do you want to update it? (y/n): " update_remote
    if [ "$update_remote" = "y" ]; then
        read -p "Enter your GitHub repository URL: " repo_url
        git remote set-url origin "$repo_url"
    fi
else
    read -p "Enter your GitHub repository URL (e.g., https://github.com/SarthakGupta-code/parkinsons-voice-detection.git): " repo_url
    git remote add origin "$repo_url"
fi

echo ""
echo "📤 Pushing to GitHub..."
git branch -M main
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully pushed to GitHub!"
    echo ""
    echo "🌐 Next steps:"
    echo "1. Go to your repository on GitHub"
    echo "2. Settings → Pages"
    echo "3. Source: Branch 'main', Folder '/ (root)'"
    echo "4. Save"
    echo ""
    echo "Your website will be available at:"
    echo "https://$(git remote get-url origin | sed 's/.*github.com[:/]\([^/]*\)\/\([^/]*\)\.git.*/\1.github.io\/\2/')"
else
    echo ""
    echo "❌ Push failed. Please check:"
    echo "1. Repository URL is correct"
    echo "2. You have push access"
    echo "3. GitHub authentication is set up"
fi

