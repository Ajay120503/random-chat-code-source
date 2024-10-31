import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import './index.css';
import App from './App.jsx';

// Create a custom theme to enable dark mode
const theme = extendTheme({
  config: {
    initialColorMode: 'dark', // Set the initial color mode to dark
    useSystemColorMode: false, // Use the system color mode (optional)
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ChakraProvider theme={theme}>
      <App />
    </ChakraProvider>
  </StrictMode>
);
