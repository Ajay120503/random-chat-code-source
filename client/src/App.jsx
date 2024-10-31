import './App.css';
import { useEffect, useRef, useState } from 'react';
import { Box, VStack, HStack, Input, Text, IconButton, Button, useToast } from '@chakra-ui/react';
import { io } from 'socket.io-client';
import { RiSendPlane2Fill } from 'react-icons/ri';
import { BiSolidExit } from "react-icons/bi";

const socket = io('http://localhost:3000'); // Update the server URL as needed

function App() {
  const [messages, setMessages] = useState(() => {
    const savedMessages = localStorage.getItem('messages');
    return savedMessages ? JSON.parse(savedMessages) : [];
  });
  const [newMessage, setNewMessage] = useState('');
  const [userId, setUserId] = useState(socket.id); // Unique ID for each user
  const [disconnected, setDisconnected] = useState(false); // State to track disconnection toast
  const messagesEndRef = useRef(null);
  const toast = useToast(); // Initialize toast
  const [userCount, setUserCount] = useState(0); // State to track user count

  useEffect(() => {
    // Update userId if socket reconnects
    socket.on('connect', () => setUserId(socket.id));

    // Listen for incoming messages from the server
    socket.on('message', (message) => {
      setMessages((prevMessages) => {
        const updatedMessages = [...prevMessages, message];
        localStorage.setItem('messages', JSON.stringify(updatedMessages));
        return updatedMessages;
      });
    });

    // Listen for new user notifications
    socket.on('userJoined', ({ userId }) => {
      toast({
        description: `New user Join the Chat`,
        status: 'info',
        duration: 3000,
        isClosable: false,
        position: "top"
      });
    });

    // Listen for user count updates
    socket.on('userCount', (count) => {
      setUserCount(count);
    });

    // Clean up on component unmount
    return () => {
      socket.off('message');
      socket.off('connect');
      socket.off('userJoined'); // Clean up userJoined listener
      socket.off('userCount'); // Clean up userCount listener
    };
  }, [toast]);

  useEffect(() => {
    // Scroll to the bottom whenever messages change with a slight delay
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, [messages]);

  const sendMessage = () => {
    if (newMessage.trim()) {
      // Emit the message with senderId to the server
      const message = { text: newMessage, senderId: userId };
      socket.emit('message', message);
      setNewMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  const clearMessages = () => {
    setMessages([]);
    localStorage.removeItem('messages');
  };

  const handleDisconnect = () => {
    // Emit a disconnect event (optional)
    socket.disconnect(); // Disconnect the socket
    // Show the toast only if it hasn't been shown before
    if (!disconnected) {
      toast({
        description: `You have left the chat.`,
        status: 'info',
        duration: 3000,
        isClosable: false,
        position: "top"
      });
      setDisconnected(true); // Update state to indicate toast has been shown
    }

    // Attempt to close the browser tab/window
    window.close(); // This may not work in all browsers unless the window was opened by the script
  };

  return (
    <Box p={2} maxW="md" mx="auto" display="flex" flexDirection="column" minH="100vh" bg="gray.900">
      <VStack spacing={4} align="stretch" flex="1">
        <HStack justify="space-between">
          <Text
            fontSize="30px"
            fontWeight="bold"
            color="gray.100" // A lighter gray for better contrast with the gray background
            textShadow="1px 1px 2px rgba(0, 0, 0, 0.5)" // Softer shadow for depth
          >
            Rnd
            <span style={{ color: 'gray.200', textShadow: '1px 1px 1px rgba(0, 0, 0, 0.5)' }}>CHAT</span> {/* Lighter shade for "CHAT" */}
          </Text>
          <HStack spacing={2}>
            <Text color="white" fontSize="20px" fontWeight={900}>{userCount}</Text> {/* Display user count */}
            <Button colorScheme="blue" size="sm" onClick={clearMessages}>Clean</Button>
            <IconButton
              bg="transparent" // Set background to transparent
              _hover={{ bg: 'transparent' }} // Ensure hover background is also transparent
              _active={{ bg: 'transparent' }} // Ensure active background is also transparent
              color="red.200" // Set the icon color (you can change this to any color you prefer)
              onClick={handleDisconnect}
              icon={<BiSolidExit />}
              aria-label="Disconnect"
              fontSize="40px"
            />
          </HStack>
        </HStack>
        <Box bg="gray.100" p={0} borderRadius="md" overflowY="auto" maxH="80vh" minH="80vh">
          {messages.map((msg, index) => (
            <HStack
              key={index}
              justify={msg.senderId === userId ? 'flex-end' : 'flex-start'}
            >
              <Text
                bg={msg.senderId === userId ? 'blue.500' : 'green.500'} // Sender-specific colors
                color="white"
                p="10px" // Padding for better spacing
                m="5px"
                borderRadius={msg.senderId === userId ? '10px 10px 0 10px' : '10px 10px 10px 0'} // Rounded corners for bubbles
                maxW="70%" // Maximum width for bubbles
                alignSelf={msg.senderId === userId ? 'flex-end' : 'flex-start'}
                boxShadow="0 2px 4px rgba(0, 0, 0, 0.2)" // Add shadow for depth
              >
                {msg.text}
              </Text>
            </HStack>
          ))}
          <div ref={messagesEndRef} />
        </Box>
        <HStack mt="auto">
          <Input
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <IconButton
            colorScheme="blue"
            onClick={sendMessage}
            icon={<RiSendPlane2Fill />}
            aria-label="Send Message"
          />
        </HStack>
      </VStack>
    </Box>
  );
}

export default App;
