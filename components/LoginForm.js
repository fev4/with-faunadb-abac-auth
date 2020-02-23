import React, {useState} from 'react';
import gql from 'graphql-tag';
import { useMutation, useApolloClient } from '@apollo/react-hooks';

const LOGIN_USER = gql`
  mutation LoginEmployeeUser($input: LoginUserInput) {
    loginUser(input: $input)
  }
`;

const LoginForm = ({ setLoginError, setLoginData}) => {
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
      if (!data.loginUser) {
        return null;
      } else {
        localStorage.setItem('token', data?.loginUser);
        setLoginData(data);
      }
    },
    onError: error => {
      if (!error) {
        return null;
      } else {
        setLoginError(error);
      }
    }
  });
  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        loginUser();
      }}
    >
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
      <button
        onClick={e => {
          e.preventDefault();
          client.resetStore();
          localStorage.removeItem('token');
          setLoginData(null);
        }}
      >
        Logout
      </button>
    </form>
  );
};

export default LoginForm;