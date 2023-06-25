# Password Management System

A password management system built using nodejs, expressjs and mongodb

## Installation

Use the package manager [npm](https://docs.npmjs.com/) to develop Password Management System and Install all its dependencies.

```bash
npm install
```
# Setting up .env file!
This Project requires Integration of Vonage API for mesaage sending for Two Factor Authentication. Which requires making a free acoount there.

  - SECRET_KEY = [KEY USED TO ENCRYPT AND DECRYPT THE PASSWORDS]
  - MONGODB_URL = [MongoDB URL], it can be local or MongoDB Atlas for Cloud Database

Get the below credentials after creating an account on [twilio](https://www.twilio.com/console/verify/services)

  - TWILIO_ACCOUNT_SID = [TWILIO_ACCOUNT_SID]
  - TWILIO_AUTH_TOKEN = [AUTH_TOKEN]
  - VERIFICATION_SID = [VERIFICATION_SID]

## Usage

```bash
npm run start
```

## Accesing the WebApp
- [Local Host Link](http://localhost:3000/)
- [Deployed app on Railway](https://passwordmanagementsystem-production.up.railway.app/)


## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## Testing 

The testing and Styling has been done by [Necrolynn47](https://github.com/Necrolynn47). Head over to [TestCases](https://github.com/bhavukkalra/Password_Management_System/blob/master/TestCases.pdf) to get to know about it more


## 2023 Update

The previous version of the app used `Vonage API` for the 2-factor Authentication, for both 
sign in and sign up flows

The current code is now being migrated to use `twilio` verification service
- Which is much cheaper
- Doesn't have the slightly annoying feature of 5 minute wait time for the user, In case of wrong OTP entered
- The final app will be hosted on AWS and will be moved from Railway
- TODO - Incoming, Terraform and Infrastructure diagrams.


## License
[MIT](https://choosealicense.com/licenses/mit/)
