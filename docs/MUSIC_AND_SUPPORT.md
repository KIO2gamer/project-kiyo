# 🎵 Music & Support Features

## Music System

The Music feature provides a complete music playback system for your Discord server, allowing members to queue, play, and control music.

### Music Commands

-   **`/play <query>`** - Search and play a song or playlist
-   **`/queue`** - Display the current music queue
-   **`/skip`** - Skip the current song
-   **`/pause`** - Pause music playback
-   **`/resume`** - Resume paused music
-   **`/stop`** - Stop music and clear the queue
-   **`/loop`** - Toggle queue looping
-   **`/nowplaying`** - Display currently playing song
-   **`/volume <level>`** - Adjust playback volume (0-100)

### Features

-   **Queue Management:** Add songs and view the queue with `/queue`
-   **Playback Control:** Full control with play, pause, resume, skip, and stop commands
-   **Volume Control:** Adjust volume with `/volume`
-   **Loop Support:** Enable looping with `/loop` for continuous playback
-   **Now Playing:** See current track with `/nowplaying`

### Configuration

The music system works with Discord voice channels. Users must be in a voice channel to use music commands. The bot automatically joins the voice channel when music starts playing.

---

## Support & Tickets System

The Support & Tickets feature allows server members to create support tickets for issues, questions, or requests that need administrative attention.

### Ticket Commands

-   **`/ticket_message`** - Send the ticket creation message to a channel
-   **`/set_ticket_category <category>`** - Set the category for new ticket channels
-   **`/close_ticket [reason]`** - Close the current ticket channel

### Features

-   **Ticket Creation:** Members can create tickets through an interactive message button
-   **Organized Management:** All tickets are created in a designated category
-   **Ticket Closure:** Support staff can close tickets with optional reasons
-   **Audit Trail:** Closed tickets are archived and can be reviewed later

### Configuration

#### Set Up Ticket System

1. **Create a Category:** Create a category channel named "Tickets" or similar (e.g., "Support Tickets")

2. **Configure the Category:**

    ```bash
    /set_ticket_category [category]
    ```

    Replace `[category]` with your ticket category name

3. **Post Ticket Message:**
    ```bash
    /ticket_message
    ```
    Run this command in the channel where users should see the ticket creation button

#### Closing Tickets

To close a ticket, run the command in the ticket channel:

```bash
/close_ticket [optional reason]
```

### How It Works

1. **User Creates Ticket:** User clicks the button in the designated channel
2. **Ticket Channel Created:** A private channel is created in the configured category
3. **Support Team Notified:** The ticket appears in the category for staff attention
4. **Issue Resolved:** Staff member runs `/close_ticket` to close and archive

### Best Practices

-   Create a public channel (e.g., `#tickets-info`) where you post the ticket message
-   Regularly review and close resolved tickets
-   Use descriptive ticket category names for organization
-   Consider setting up role-based permissions on the ticket category
