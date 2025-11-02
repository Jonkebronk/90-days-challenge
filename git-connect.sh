#!/bin/bash

# GitHub Connection Script
echo "🚀 Connecting to GitHub..."
echo ""
echo "First, create a GitHub repository:"
echo "1. Go to: https://github.com/new"
echo "2. Name: 90-days-challenge"
echo "3. DO NOT add README or .gitignore"
echo "4. Copy the repository URL"
echo ""
read -p "Enter your GitHub repository URL: " REPO_URL

if [ -z "$REPO_URL" ]; then
    echo "❌ No URL provided. Exiting."
    exit 1
fi

echo ""
echo "📡 Adding remote..."
git remote add origin "$REPO_URL"

echo "✅ Remote added!"
echo ""
echo "🌿 Setting branch to main..."
git branch -M main

echo ""
echo "📤 Pushing to GitHub..."
git push -u origin main

echo ""
echo "🎉 Done! Your project is now on GitHub!"
echo "🔗 Visit: $REPO_URL"
