# MongoDB Setup Guide

## Installation

### Windows
1. Download MongoDB Community Server from: https://www.mongodb.com/try/download/community
2. Run the installer and follow the setup wizard
3. MongoDB will be installed and started as a Windows service by default

### macOS
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

### Linux (Ubuntu/Debian)
```bash
sudo apt-get update
sudo apt-get install -y mongodb
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

## Verify Installation

Check if MongoDB is running:
```bash
# Windows (PowerShell)
Get-Service MongoDB

# macOS/Linux
brew services list  # macOS
sudo systemctl status mongodb  # Linux
```

## Connection

The app connects to MongoDB using the default connection string:
- Default: `mongodb://localhost:27017/`
- Database name: `smartroommate`
- Collection name: `users`

## Environment Variables (Optional)

You can customize the MongoDB connection by setting `MONGODB_URI` in your `.env` file:

```
MONGODB_URI=mongodb://localhost:27017/
```

## Testing the Connection

Once MongoDB is running, start the Flask backend:
```bash
cd smartroommate-backend
python app.py
```

You should see: "MongoDB connected successfully" in the console.

## Troubleshooting

1. **Connection refused**: Make sure MongoDB service is running
2. **Port 27017 in use**: Check if another MongoDB instance is running
3. **Permission errors**: Ensure MongoDB has proper permissions to create databases

