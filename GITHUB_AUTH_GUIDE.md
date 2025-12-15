# GitHub Authentication Guide for Footy Fest

## Current Issue
Your repository is configured but needs authentication to push to GitHub.

## Solution Options

### Option 1: Personal Access Token (HTTPS) - RECOMMENDED

**Step 1: Create a Personal Access Token**

1. Go to: https://github.com/settings/tokens
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Fill in:
   - **Note**: `FootyFest Push Token`
   - **Expiration**: Choose your preference (90 days, 1 year, or no expiration)
   - **Scopes**: Check **`repo`** (this gives full repository access)
4. Click **"Generate token"**
5. **IMPORTANT**: Copy the token immediately (you won't see it again!)
   - It will look like: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

**Step 2: Push Using the Token**

Run this command:
```bash
cd /Users/user/Documents/Cursor
git push -u origin main
```

When prompted:
- **Username**: `pujangrg1`
- **Password**: Paste your Personal Access Token (NOT your GitHub password)

**Step 3: Save Credentials (Optional)**

To avoid entering the token every time:
```bash
git config --global credential.helper osxkeychain
```

Then push again - macOS Keychain will save your credentials.

---

### Option 2: SSH Keys (Alternative)

**Step 1: Generate SSH Key**

```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
```

Press Enter to accept default location. Optionally set a passphrase.

**Step 2: Add SSH Key to SSH Agent**

```bash
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
```

**Step 3: Copy Public Key**

```bash
cat ~/.ssh/id_ed25519.pub
```

Copy the entire output (starts with `ssh-ed25519`).

**Step 4: Add Key to GitHub**

1. Go to: https://github.com/settings/keys
2. Click **"New SSH key"**
3. Fill in:
   - **Title**: `FootyFest MacBook`
   - **Key**: Paste your public key
4. Click **"Add SSH key"**

**Step 5: Switch Remote to SSH and Push**

```bash
cd /Users/user/Documents/Cursor
git remote set-url origin git@github.com:pujangrg1/FootyFest.git
git push -u origin main
```

---

### Option 3: GitHub CLI (Easiest)

**Step 1: Install GitHub CLI**

```bash
brew install gh
```

**Step 2: Authenticate**

```bash
gh auth login
```

Follow the prompts:
- Choose GitHub.com
- Choose HTTPS
- Authenticate in browser
- Choose your preferred authentication method

**Step 3: Push**

```bash
cd /Users/user/Documents/Cursor
git push -u origin main
```

---

## Quick Test

After setting up authentication, test the connection:

**For HTTPS:**
```bash
git ls-remote origin
```

**For SSH:**
```bash
ssh -T git@github.com
```

You should see: `Hi pujangrg1! You've successfully authenticated...`

---

## Troubleshooting

### "Permission denied" Error

- **HTTPS**: Make sure you're using the Personal Access Token, not your password
- **SSH**: Make sure your SSH key is added to GitHub and the SSH agent is running

### "Repository not found" Error

- Check that the repository exists: https://github.com/pujangrg1/FootyFest
- Verify you have push access to the repository

### Credentials Not Saving

```bash
# Clear old credentials
git credential-osxkeychain erase
host=github.com
protocol=https
[Press Enter twice]

# Then try pushing again
```

---

## Current Status

✅ Git repository initialized
✅ Remote configured: `https://github.com/pujangrg1/FootyFest.git`
✅ All files committed (78 files)
⏳ Waiting for authentication to push

Once authenticated, your code will be pushed to: https://github.com/pujangrg1/FootyFest

