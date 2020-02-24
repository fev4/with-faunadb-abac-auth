import React, { useState } from 'react';
import { useLazyQuery } from '@apollo/react-hooks';
import cookie from 'js-cookie';
import { withApollo } from '../lib/apollo';
import LoginForm from '../components/LoginForm';
import { GET_ALL_FILES } from '../lib/queries/getAllFiles';

const IndexPage = () => {
  const [loginError, setLoginError] = useState(null);
  const [loginData, setLoginData] = useState(cookie.get('token'));
  const [
    getAllFiles,
    { loading, data: allFilesData, error: allFilesError },
  ] = useLazyQuery(GET_ALL_FILES);

  return (
    <div>
      <LoginForm
        setLoginError={setLoginError}
        setLoginData={setLoginData}
        getAllFiles={getAllFiles}
      />
      <button onClick={() => getAllFiles()}>Get All Files</button>
      <br />
      File Data
      <pre>
        {loading ? (
          <div>loading...</div>
        ) : allFilesError ? (
          JSON.stringify(allFilesError, null, 2)
        ) : (
          JSON.stringify(allFilesData, null, 2)
        )}
      </pre>
      Login Data
      <pre>
        {loginError
          ? JSON.stringify(loginError, null, 2)
          : JSON.stringify(loginData, null, 2)}
      </pre>
    </div>
  );};

export default withApollo()(IndexPage)
