const jwt = require('jsonwebtoken');
const axios = require('axios');
const User = require('../models/User');
const { encrypt, decrypt } = require('../src/utils/encryption');

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const user = await User.findByCredentials(email, password);
    const token = await user.generateAuthToken();
    const refreshToken = await user.generateRefreshToken();
    
    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
        avatar: user.avatar
      },
      token,
      refreshToken
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(401).json({ error: 'Invalid login credentials' });
  }
};

exports.redirectToDiscord = (req, res) => {
  try {
    const state = encrypt(JSON.stringify({
      userId: req.body.userId,
      redirectUrl: req.body.redirectUrl || '/dashboard'
    }));
    
    const discordUrl = `https://discord.com/oauth2/authorize?client_id=${
      process.env.DISCORD_CLIENT_ID
    }&redirect_uri=${
      encodeURIComponent(process.env.DISCORD_REDIRECT_URI)
    }&response_type=code&scope=identify%20guilds&state=${encodeURIComponent(state)}`;
    
    res.json({ url: discordUrl });
  } catch (error) {
    console.error('Discord redirect error:', error);
    res.status(500).json({ error: 'Failed to generate Discord authorization URL' });
  }
};

exports.handleDiscordCallback = async (req, res) => {
  try {
    const { code, state } = req.query;
    
    if (!code || !state) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    // Decrypt and parse the state
    const decryptedState = decrypt(state);
    const parsedState = JSON.parse(decryptedState);
    
    // Exchange code for token
    const tokenResponse = await axios.post(
      'https://discord.com/api/oauth2/token',
      new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: process.env.DISCORD_REDIRECT_URI,
        scope: 'identify guilds'
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    const { access_token } = tokenResponse.data;
    
    // Get user info from Discord
    const userResponse = await axios.get('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    
    // Get user's guilds
    const guildsResponse = await axios.get('https://discord.com/api/users/@me/guilds', {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    
    const discordUser = userResponse.data;
    const userGuilds = guildsResponse.data.map(guild => guild.id);
    
    // Find or create user
    let user = await User.findOne({ discordId: discordUser.id });
    
    if (!user) {
      // If user doesn't exist but userId was provided in state, link discord to existing account
      if (parsedState.userId) {
        user = await User.findById(parsedState.userId);
        if (user) {
          user.discordId = discordUser.id;
          user.discordUsername = `${discordUser.username}#${discordUser.discriminator}`;
          user.avatar = discordUser.avatar 
            ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
            : null;
          user.guilds = userGuilds;
          await user.save();
        }
      }
      
      // If still no user, create a new one
      if (!user) {
        user = new User({
          username: discordUser.username,
          email: discordUser.email || `${discordUser.id}@discord.placeholder`,
          password: crypto.randomBytes(20).toString('hex'),
          discordId: discordUser.id,
          discordUsername: `${discordUser.username}#${discordUser.discriminator}`,
          avatar: discordUser.avatar 
            ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
            : null,
          guilds: userGuilds
        });
        await user.save();
      }
    } else {
      // Update existing user's Discord info
      user.discordUsername = `${discordUser.username}#${discordUser.discriminator}`;
      user.avatar = discordUser.avatar 
        ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
        : null;
      user.guilds = userGuilds;
      await user.save();
    }
    
    // Generate tokens
    const token = await user.generateAuthToken();
    const refreshToken = await user.generateRefreshToken();
    
    // Redirect to frontend with token
    const redirectUrl = parsedState.redirectUrl || '/dashboard';
    res.redirect(`${process.env.FRONTEND_URL}${redirectUrl}?token=${token}&refreshToken=${refreshToken}`);
  } catch (error) {
    console.error('Discord callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/auth/error?message=${encodeURIComponent('Failed to authenticate with Discord')}`);
  }
};

exports.verifyYouTube = async (req, res) => {
  try {
    const { youtubeChannelId, discordUserId } = req.body;
    
    if (!youtubeChannelId || !discordUserId) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    // Verify YouTube channel ownership would go here
    // This would typically involve a more complex OAuth flow with YouTube
    
    // For now, just log the attempt
    console.log(`Verification requested for YouTube channel ${youtubeChannelId} by Discord user ${discordUserId}`);
    
    res.status(200).json({ message: 'Verification process initiated', status: 'pending' });
  } catch (error) {
    console.error('YouTube verification error:', error);
    res.status(500).json({ error: 'YouTube verification failed' });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }
    
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findOne({ _id: decoded.userId, refreshToken });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }
    
    // Generate new tokens
    const newToken = await user.generateAuthToken();
    const newRefreshToken = await user.generateRefreshToken();
    
    res.json({ token: newToken, refreshToken: newRefreshToken });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({ error: 'Token refresh failed' });
  }
};

exports.logout = async (req, res) => {
  try {
    req.user.refreshToken = null;
    await req.user.save();
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
};
