import { useEffect, useRef, useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Input,
  Text,
  IconButton,
  Button,
  Avatar,
  useToast,
  Spinner,
  useColorMode,
  useColorModeValue,
  Divider,
  Fade,
} from '@chakra-ui/react';
import { io } from 'socket.io-client';
import { RiSendPlane2Fill } from 'react-icons/ri';
import { MoonIcon, SunIcon } from '@chakra-ui/icons';
import { motion } from 'framer-motion';

const MotionBox = motion(Box);

const socket = io('https://random-chat-server.onrender.com'); // Update the server URL as needed

function App() {
  const [messages, setMessages] = useState(() => {
    const savedMessages = localStorage.getItem('messages');
    return savedMessages ? JSON.parse(savedMessages) : [];
  });
  const [newMessage, setNewMessage] = useState('');
  const [userId, setUserId] = useState(socket.id);
  const [userCount, setUserCount] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const toast = useToast();
  const { toggleColorMode } = useColorMode();
  const bg = useColorModeValue('gray.100', 'gray.800');
  const inputBg = useColorModeValue('white', 'gray.700');
  const buttonBg = useColorModeValue('blue.500', 'blue.300');

  useEffect(() => {
    socket.on('connect', () => setUserId(socket.id));

    socket.on('message', (message) => {
      setMessages((prevMessages) => {
        const updatedMessages = [...prevMessages, message];
        localStorage.setItem('messages', JSON.stringify(updatedMessages));
        return updatedMessages;
      });
    });

    socket.on('userJoined', () => {
      toast({
        description: `A new user joined the chat`,
        status: 'info',
        duration: 3000,
        isClosable: false,
        position: 'top',
      });
    });

    socket.on('userCount', (count) => setUserCount(count));

    socket.on('typing', () => {
      setIsTyping(true);
      setTimeout(() => setIsTyping(false), 2000); // Reset after 2 seconds
    });

    return () => {
      socket.off('message');
      socket.off('connect');
      socket.off('userJoined');
      socket.off('userCount');
      socket.off('typing');
    };
  }, [toast]);

  useEffect(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, [messages]);

  const sendMessage = () => {
    if (newMessage.trim()) {
      const message = { text: newMessage, senderId: userId, timestamp: new Date().toLocaleTimeString() };
      socket.emit('message', message);
      setNewMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    } else {
      socket.emit('typing');
    }
  };

  const clearMessages = () => {
    setMessages([]);
    localStorage.removeItem('messages');
  };

  return (
    <MotionBox
      p={[2, 2, 2]}
      minH="100vh"
      display="flex"
      flexDirection="column"
      bg={bg}
      animate={{ opacity: 1 }}
      initial={{ opacity: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <VStack spacing={4} align="stretch" flex="1" maxW="container.sm" mx="auto">
        {/* Header Section */}
        <HStack justify="space-between" w="full" flexWrap="wrap">
          <HStack spacing={4}>
            <Text
              fontSize={['20px', '30px']}
              fontWeight="bold"
              color="blue.400"
              textShadow="2px 2px 4px rgba(0, 0, 0, 0.5)"
              mr={5}
            >
              Rnd<span style={{ color: 'gray.500' }}>CHAT</span>
            </Text>
          </HStack>
          <HStack spacing={3} flexWrap="wrap">
            <Avatar size="sm" bg="blue.300" />
            <Text color="white" fontSize="20px" fontWeight="bold">
              {userCount}
            </Text>
            <Button onClick={toggleColorMode} size="sm">
              {useColorModeValue(<MoonIcon fontSize="17px" />, <SunIcon fontSize="17px" />)}
            </Button>
            <Button colorScheme="red" size="sm" onClick={clearMessages}>
              <i style={{ fontSize: '17px' }} className="fa-solid fa-trash"></i>
            </Button>
          </HStack>
        </HStack>

        <Divider />

        {/* Messages Area */}
        <MotionBox
          bg={inputBg}
          p={4}
          borderRadius="md"
          overflowY="auto"
          maxH="65vh"
          minH="65vh"
          boxShadow="lg"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.3 }}
        >
          {messages.map((msg, index) => (
            <HStack
              key={index}
              justify={msg.senderId === userId ? 'flex-end' : 'flex-start'}
              spacing={3}
              alignItems="self-start"
            >
              <Avatar size="sm" bg={msg.senderId === userId ? 'blue.300' : 'green.300'} />
              <VStack align={msg.senderId === userId ? 'flex-end' : 'flex-start'}>
                <Text
                  bg={msg.senderId === userId ? buttonBg : 'green.500'}
                  color="white"
                  p="10px"
                  m="5px"
                  borderRadius="md"
                  boxShadow="0 4px 6px rgba(0, 0, 0, 0.2)"
                  maxW="300px"
                  wordBreak="break-word"  // To ensure long messages wrap correctly
                  whiteSpace="normal"     // Avoid text overflowing
                >
                  {msg.text}
                </Text>
                <Text fontSize="xs" color="gray.400">
                  {msg.timestamp}
                </Text>
              </VStack>
            </HStack>
          ))}
          <div ref={messagesEndRef} />
        </MotionBox>

        {isTyping && (
          <Fade in={isTyping}>
            <HStack>
              <Spinner size="xs" />
              <Text fontSize="sm" color="gray.400">
                Someone is typing...
              </Text>
            </HStack>
          </Fade>
        )}

        {/* Input Section */}
        <HStack mt={5} w="full" spacing={4} flexWrap="wrap">
          <Input
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            bg={inputBg}
            flex="1"
          />
          <IconButton
            colorScheme="blue"
            onClick={sendMessage}
            icon={<RiSendPlane2Fill />}
            aria-label="Send Message"
            size="lg"
            isRound
          />
        </HStack>
      </VStack>
    </MotionBox>
  );
}

export default App;
