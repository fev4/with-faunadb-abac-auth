The current repository follows insights from several examples:

- [with-apollo](https://github.com/zeit/next.js/tree/canary/examples/with-apollo)
- [with-cookie-auth-fauna](https://github.com/zeit/next.js/tree/canary/examples/with-cookie-auth-fauna)
- [with-cookie-auth](https://github.com/zeit/next.js/tree/canary/examples/with-cookie-auth)
- [api-routes-apollo-server-and-client-auth](https://github.com/zeit/next.js/tree/canary/examples/api-routes-apollo-server-and-client-auth)
- [faunadb-abac-graphql](https://fauna.com/blog/abac-graphql)
- [auth example by HaNdTriX](https://github.com/zeit/next.js/pull/10451)
- [apollo graphql auth docs](https://www.apollographql.com/docs/react/networking/authentication/)

It showcases how to login and set a cookie with a faunadb key specific to the logged in user following ABAC practices.

There are two users:

- A manager with username: **bill.lumbergh** and pwd: **123456** which will access all private and public files during all days, except **Sundays**.
- An employee with username: **peter.gibbons** and pwd: **abcdef** which will only access public files.

The deployment URL to test this out is: [https://with-faunadb-abac-auth.now.sh/](https://with-faunadb-abac-auth.now.sh/)