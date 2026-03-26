import React, {useState, useEffect, createContext, useContext} from "react";
import {useNavigate, useLocation} from 'react-router-dom';

function parseJwt (token: string) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
}

    const checkAuthentication = (token: string) => {
        if (token) {
            const decodedToken = parseJwt(token);

            const timestampMillis = Date.now();
            const timestampSeconds = Math.floor(timestampMillis / 1000);
            return (decodedToken.exp>=timestampSeconds)
        }

        return false
    }

function storeToken(token: string){
    localStorage.setItem(TOKEN_KEY, token);
}

function retrieveToken(){
    return localStorage.getItem(TOKEN_KEY);
}

type User = {
    username: string,
    exp: number
}

type AuthContextType = {
  // Define your auth context shape here, e.g.:
  user: User | null;
  logoutUser: () => void;
  loginUser: (token: string) => boolean;
  isAuthenticated: boolean;
  getToken: () => string | null;
}

const TOKEN_KEY = "FITTRACKER_TOKEN";
const TOKEN_KEY_FROM_AUTH_SERVICE = "token"
const LOGIN_ENDPOINT = '/'

const AuthContext = createContext<AuthContextType |undefined>(undefined);

export default AuthContext;

type AuthProviderProps = {children: React.ReactNode}

const AuthProvider: React.FC<AuthProviderProps> = ({children}) => {

    useEffect(() => {
    const token = retrieveToken();
    if (token) {
        loginUser(token);
    }
}, []);

    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [user, setUser] = useState<User | null>(null);


    let history = useNavigate();

    let logoutUser = () => {
        localStorage.removeItem(TOKEN_KEY);
        setIsAuthenticated(false);
        setUser(null);
        history(LOGIN_ENDPOINT);
    };

    let loginUser = (token: string) => {
        
        try {
            const authenticated = checkAuthentication(token);

            setIsAuthenticated(authenticated);
            setUser(parseJwt(token));
            return true;
        } catch {
            setIsAuthenticated(false);
            setUser(null);
        }

        return false;

    }

    const getToken = () => {
        return retrieveToken();
    }

    const contextData = {
        logoutUser,
        loginUser,
        isAuthenticated,
        user, 
        getToken
    }

    return <AuthContext.Provider value={contextData}>{children}</AuthContext.Provider>
    
}

const useAuthContext = (): AuthContextType => {

    const context = useContext(AuthContext);

    if (context === undefined) {
        throw Error('AuthContext has to be used within an auth AuthProviderContext')
    }
    return context
}

const AuthHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();

    const {loginUser} = useAuthContext();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get(TOKEN_KEY_FROM_AUTH_SERVICE);
    if (token) {
        storeToken(token);
        loginUser(token)
      // Clean the URL by removing the token param without reloading page
        params.delete(TOKEN_KEY_FROM_AUTH_SERVICE);
        const cleanSearch = params.toString();
        const cleanUrl = location.pathname + (cleanSearch ? `?${cleanSearch}` : '');
        window.history.replaceState(null, '', cleanUrl);

        // Redirect to home or intended page without token in URL
        navigate(cleanUrl, { replace: true });
    }
  }, [location, navigate]);

  return null; // This component just runs the effect
}

export { AuthProvider, AuthHandler, useAuthContext };