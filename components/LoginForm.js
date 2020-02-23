import React, {useState, useEffect} from 'react';
import gql from 'graphql-tag';
import { useMutation, useApolloClient } from '@apollo/react-hooks';
import cookie from 'js-cookie';

const LOGIN_USER = gql`
  mutation LoginEmployeeUser($input: LoginUserInput) {
    loginUser(input: $input)
  }
`;

const LoginForm = ({ setLoginError, setLoginData}) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const client = useApolloClient();
  const [username, setUsername] = useState('');
  const [pwd, setPwd] = useState('');
  const [
    loginUser
  ] = useMutation(LOGIN_USER, {
    variables: {
      input: {
        username,
        password: pwd,
      },
    },
    onCompleted: data => {
      cookie.set('token', data?.loginUser, {
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        expires: 6,
      });
      setLoginData(data);
      setIsLoggedIn(true);
      setLoginError(false);
    },
    onError: error => {
      setLoginError(error);
    }
  });
  useEffect(() => {
    setIsLoggedIn(cookie.get('token') ? true : false);
  }, []);
  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        loginUser();
      }}
    >
      {!isLoggedIn ? (
        <>
          <label htmlFor="username">Username:</label>
          <input
            type="username"
            id="username"
            name="username"
            value={username}
            onChange={e => setUsername(e.target.value)}
          />
          <label htmlFor="pwd">Password:</label>
          <input
            type="password"
            id="pwd"
            name="pwd"
            value={pwd}
            onChange={e => setPwd(e.target.value)}
          />
          <button type="submit">Login</button>
        </>
      ) : (
        <button
          onClick={e => {
            e.preventDefault();
            client.resetStore();
            cookie.remove('token');
            setLoginData(null);
            setIsLoggedIn(false);
          }}
        >
          Logout
        </button>
      )}
    </form>
  );
};

export default LoginForm;