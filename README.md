# Next.js + FaunaDB Cookie Based Login + ABAC + Apollo GraphQL

The current repository follows insights from several examples and applies several suggestions and comments from the amazing FaunaDB team (directly from Slack):

- [with-apollo](https://github.com/zeit/next.js/tree/canary/examples/with-apollo)
- [with-cookie-auth-fauna](https://github.com/zeit/next.js/tree/canary/examples/with-cookie-auth-fauna)
- [with-cookie-auth](https://github.com/zeit/next.js/tree/canary/examples/with-cookie-auth)
- [api-routes-apollo-server-and-client-auth](https://github.com/zeit/next.js/tree/canary/examples/api-routes-apollo-server-and-client-auth)
- [faunadb-abac-graphql](https://fauna.com/blog/abac-graphql)
- [auth example by HaNdTriX](https://github.com/zeit/next.js/pull/10451)
- [apollo graphql auth docs](https://www.apollographql.com/docs/react/networking/authentication/)

It showcases how to login and set a cookie with a faunadb key specific to the logged in user following ABAC practices.

## Deployment

The deployment URL to test this out is: [https://with-faunadb-abac-auth.now.sh/](https://with-faunadb-abac-auth.now.sh/)

## Types of users

There are only 2 types of users:

- A manager with username: **bill.lumbergh** and pwd: **123456** which will access all private and public files during all days, except **Sundays**.
- Two employees with username: **peter.gibbons** / pwd: **abcdef**  and **felipe.vasquez** / pwd: **123** which will only access public files and only files created by them.

## GraphQL Schema

The current Schema used is [found here](https://github.com/fillipvt/with-faunadb-abac-auth/blob/master/schema.graphql). Notice the custom `@resolver`s.

## Custom resolvers

### Create User `create_user` resolver

Notice here the usage of the `credentials` parameter, which can be part of every document of every collection. We just happen to use it here for documents under the collection called `User`. Here are the [docs for the `Create` function](https://docs.fauna.com/fauna/current/api/fql/functions/create).

````
Update(Function("create_user"), {
  "body": Query(
    Lambda(["input"],
      Create(Collection("User"), {
        data: {
          username: Select("username", Var("input")),
          role: Select("role", Var("input")),
        },
        credentials: {
          password: Select("password", Var("input"))
        }
      })  
    )
  )
});
````

### Login User `login_user` resolver

Notice that we use the `Index` `unique_User_username` (which was created automatically by FaunaDB when importing the [Schema]((https://github.com/fillipvt/with-faunadb-abac-auth/blob/master/schema.graphql))) in order to match the user logging in to the existing users.

````
Update(Function("login_user"), {
  "body": Query(
    Lambda(["input"],
      Select(
        "secret",
        Login(
          Match(Index("unique_User_username"), Select("username", Var("input"))), 
          { password: Select("password", Var("input")) }
        )
      )
    )
  )
});
````

## Attribute Based Access Control - Rules

- A manager can access all files, private or public, be it theirs or created by any employee, except on Sundays.
- An employee can only access public files created by them. This means that if a file is associated to a user but it was set as private, then said user will not be able to see it.

You can paste the following code directly in the FaunaDB Console Shell.

### Employee Role

````
CreateRole({
  name: "employee_role",
  membership: {
    resource: Collection("User"),
    predicate: Query( 
      Lambda("userRef",
        // User attribute based rule:
        // It grants access only if the User has EMPLOYEE role.
        // If so, further rules specified in the privileges
        // section are applied next.        
        Equals(Select(["data", "role"], Get(Var("userRef"))), "EMPLOYEE")
      )
    )
  },
  privileges: [
      {
        // Note: 'allFiles' Index is used to retrieve the 
        // documents from the File collection. Therefore, 
        // read access to the Index is required here as well.
        resource: Index("allFiles"),
        actions: { read: true } 
      },
      {
        resource: Collection("User"),
        actions: {
          // Action attribute based rule:
          // It grants read access to the User collection.
          read: Query(
            Lambda("userRef",
              Equals(Identity(), Var("userRef"))
            )
          )
        }
      },
      {
        resource: Collection("File"),
        actions: {
          // Action attribute based rule:
          // It grants read access to the File collection.
          read: Query(
            Lambda("fileRef",
              Let(
                {
                  file: Get(Var("fileRef")),
                  userRef: Identity()
                },
                // Resource attribute based rule:
                // It grants access to public files only,
                // which are owned by the user.
                And(
                  Not(Select(["data", "confidential"], Var("file"))),
                  Equals(
                    Select(["data", "owner"], Var("file")),
                    Var("userRef")
                  )
                )
              )
            )
          )
        }
      }
    ]
})
````

### Manager Role

````
CreateRole({
  name: "manager_role",
  membership: {
    resource: Collection("User"),
    predicate: Query(
      Lambda("userRef", 
        // User attribute based rule:
        // It grants access only if the User has MANAGER role.
        // If so, further rules specified in the privileges
        // section are applied next.
        Equals(Select(["data", "role"], Get(Var("userRef"))), "MANAGER")
      )
    )
  },
  privileges: [
      {
        // Note: 'allFiles' Index is used to retrieve the 
        // documents from the File collection. Therefore, 
        // read access to the Index is required here as well.
        resource: Index("allFiles"),
        actions: { read: true } 
      },
      {
        resource: Collection("User"),
        // Action attribute based rule:
        // It grants read access to the User collection.
        actions: { read: true } 
      },
      {
        resource: Collection("File"),
        actions: {
          // Action attribute based rule:
          // It grants read access to the File collection.
          // Public/Private files, except on Sundays
          read: Query(
            Lambda("fileRef",
              Let(
                {
                  file: Get(Var("fileRef")),
                  dayOfWeek: DayOfWeek(Now())
                },
                Or(
                  Not(Select(["data", "confidential"], Var("file"))),
                  And(
                    Select(["data", "confidential"], Var("file")),
                    And(GTE(Var("dayOfWeek"), 1), LTE(Var("dayOfWeek"), 6))  
                  )
                )
              )
            )
          )
        }
      }
    ]
})
````

### Public role

This role applies to the functions in charge of login and user creation. It also applies to the index needed to perform said functions. In other words, this role is automatically applied to every user when they are not logged in. It's [currently applied here via a token](https://github.com/fillipvt/with-faunadb-abac-auth/blob/master/apolloClient.js#L24).

````
CreateRole({
  name: "Public",
    "privileges": [
    {
      "resource": Function("create_user"),
      "actions": {
        "call": true
      }
    },
    {
      "resource": Collection("User"),
      "actions": {
        "create": true
      }
    },
    {
      "resource": Function("login_user"),
      "actions": {
        "call": true
      }
    },
    {
      "resource": Index("unique_User_username"),
      "actions": {
        "read": true
      }
    }
  ]
})
````

## Updating roles

If you want to update a role remember this structure. Here are [the docs](https://docs.fauna.com/fauna/current/api/fql/functions/update).

````
Update(
  Role("name_of_role"),
  {
    //parameters to update in the selected reference (in this case a role of name "name_of_role")
    membership: {
      //definition of who/what gets this role
    },
    privileges: [
      {
        //privilage 1
      },
      {
        //privilage 2
      }
    ]
  }
)
````

## Thanks

Special thanks to Leo Regnier and Ewan Edwards (FaunaDB team) for their incredible help.