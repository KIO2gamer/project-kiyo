// Dynamically import Chai
import('chai').then(({ expect }) => {
    const { CommandHandler } = require('./events/interactionCreate'); // Adjust the import path according to your project structure
  
    describe('Ping Command', () => {
      it('should respond with Pong!', async () => {
        const mockMessage = {
          content: '/ping',
          author: {
            bot: false,
          },
        };
  
        const commandHandler = new CommandHandler();
        await commandHandler.handleCommand(mockMessage);
  
        // Assuming the command handler modifies the message object to indicate success
        expect(mockMessage.content).to.equal('Pong!');
      });
    });
  });