import gql from 'graphql-tag';

export const LOGIN_USER = gql`
  mutation LoginEmployeeUser($input: LoginUserInput) {
    loginUser(input: $input)
  }
`;
