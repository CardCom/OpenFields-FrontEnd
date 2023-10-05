This project is an simplfied example of CardCom's Open Fields module. It contains a nodejs backend part as well.

The module allows you to: 
    1. Integrate Cardcom's Credit Card and CVV fields into your own form.
    2. Style the inputs as you like. 
    3. Submit a secure payment PCI.
    4. Use a secure 3DS module. 
    5. Use Google reCaptcha

In order to work with the module you will need to:
    1. Create a LowProfile deal for each submittion.
    2. Listen to PostMessage event from the iFrame.


Every PostMessage sent to and from the iFrame will contain an action name. Messages without action name should be ignored (are part of 3DS process)
The action types are:

User Actions:
init: Inits the iFrame - send your lowProfileCode you've created in the first step, add your desired CSS and a placeholder for the input field.
doTransaction: this will submit the payment. You will need to provide additional data like CVV, expiration date, numberOfPayments, and all user data like name, address etc.

Cardcom Actions:
HandleSubmit: contains data regarding users payment submit.
HandleEror: any errors will be retuned under this action.

iframes must have the following ids: 
    CardComMasterFrame
    CardComCardNumber
    CardComCvv
    CardComCaptchaIframe







