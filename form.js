

// Configure your terminal number here.
// In production, return this from your backend /init endpoint.
const TERMINAL_NUMBER = 1000;
var lowProfileCode = undefined;
var iframeMessage = {};
var iframe = null;
var loading = null;

document.addEventListener("DOMContentLoaded", () => {
    const firstSceen = document.getElementById('first-screen');
    const secondSceen = document.getElementById('second-screen');
    iframe = document.querySelector('#CardComMasterFrame');
    loading = document.getElementById('loading');
    document.getElementById('continue').addEventListener('click', nextScreen);

    //set the expiration year to a valid year for testing purposes. In production, you should set the year options according to the current year.
    const expirationYearInput = document.getElementById('expirationYear');
    const currentYear = new Date().getFullYear();
    expirationYearInput.value = currentYear + 1;

    function nextScreen(event) {
        event.preventDefault();
        //change displays
        firstSceen.style.display = 'none';
        secondSceen.style.display = 'block';

        //setup event listeners and form submission
        window.addEventListener("message", handleFrameMessages);
        handleFormSubmit();

        //initialize payment flow for credit card form
        initializePaymentFlow();
    }

    function handleFrameMessages(message) {
        //add validations here that the message came from secure.cardcom.solutions
        const msg = message.data

        switch (msg.action) {
            case "initialized":
                // Reveal each wallet iframe based on device/browser availability.
                // The native button is rendered inside the iframe. 'initialized' may
                // fire more than once as each wallet reports its status.
                if (msg.isGooglePayAvailable)
                    document.getElementById('CardComGooglePay').style.display = 'block';
                if (msg.isApplePayAvailable)
                    document.getElementById('CardComApplePay').style.display = 'block';
                break;
            case "HandleSubmit":
                //redirect to your succssess page here
                console.log("HandleSubmit", msg);
                handleSubmitResult(msg.data);
                break;
            case "HandleEror":
                //redirect to your error page / display error popup here
                loading.style.display = 'none';
                console.log("HandleEror", msg);
                // message can be a string (server errors) or an array of strings (validation errors)
                const errorText = Array.isArray(msg.message) ? msg.message.join('\n') : msg.message;
                alert(errorText);
                break;
            case "handleValidations":
                if (msg.field === "cvv");
                    setCvvFieldClass(msg.isValid);
                if (msg.field === "cardNumber");
                    setCardNumberClass(msg.isValid);
                if (msg.field === "reCaptcha") {
                    //if you want to enable the "pay" button after all iframe fields have beed validated
                }
            default:
                break;
        }
    }

    function setCvvFieldClass(isValid) {
        if (!isValid) {
            iframe.contentWindow.postMessage({
                action: 'addCvvFieldClass',
                className: "invalid"
            }, '*');
        }
        else {
            iframe.contentWindow.postMessage({
                action: 'removeCvvFieldClass',
                className: "invalid"
            }, '*');
        }
    }

    function setCardNumberClass(isValid) {
        if (isValid)
            iframe.contentWindow.postMessage({ action: 'removeCardNumberFieldClass', className: "invalid" }, '*');
        else
            iframe.contentWindow.postMessage({ action: 'addCardNumberFieldClass', className: "invalid" }, '*');
    }

    function handleSubmitResult(data) {
        loading.style.display = 'none'
        if (data.IsSuccess)
            alert(data.Description);
        else
            alert("Deal failed");
    }

    function handleFormSubmit() {
        const form = document.getElementById('form')
        form.addEventListener("submit", (e) => {
            submitForm(e);
        })
    }
})

async function loadIframesCss() {
    /*
        You have several ways to fetch your CSS to be sent to CardCom iframe: regular *.css file, template element or plain text
        Eventually you need to send a string that represents valid CSS rules
    */

    // 1.Fetching CSS from files
    const cardCSSPromise = await fetch('../styles/cardNumber.css');
    const cardCssText = await cardCSSPromise.text();

    //2.In template element
    const template = document.getElementById('css_template').content.querySelector('style')

    //3.Store your CSS in a string variable 
    const inlineCSS = `body {
                        margin: 0;
                        padding:0;
                        display: flex;
                    }`

    //Note: props names are important
    iframeMessage = {
        action: 'init',
        cardFieldCSS: cardCssText,
        cvvFieldCSS: template.innerText.toString(),
        reCaptchaFieldCSS: inlineCSS,
        placeholder: "1111-2222-3333-4444",
        cvvPlaceholder: "123",
        lowProfileCode: lowProfileCode,
        // Language of the messages returned by the master frame ('he' | 'en').
        // Keep it in sync with the ?language= query parameter on the iframe URLs in form.html.
        language: "he",

        // Wallet button design — forwarded to the Google Pay / Apple Pay iframes.
        googlePayButton: { buttonColor: 'black', buttonType: 'buy', buttonSizeMode: 'fill', buttonRadius: 4, buttonLocale: 'en' },
        applePayButton: { type: 'buy', buttonstyle: 'black', locale: 'en-US' },
    }

    iframe.contentWindow.postMessage(iframeMessage, '*');
}

async function initializePaymentFlow() {
    // Skip if already initialized
    if (lowProfileCode) {
        return true;
    }

    // Create a low profile deal and initialize the payment iframes
    const url = "http://127.0.0.1:8000"; //your backend url

    try {
        loading.style.display = 'flex';
        const res = await fetch(`${url}/init`);
        const json = await res.json();
        lowProfileCode = json.LowProfileId; //add try / catch here - make sure you have the id.
        console.log("lowProfileCode", lowProfileCode);

        // Google Pay and Apple Pay each render inside their own visible iframe
        // (CardComGooglePay / CardComApplePay). The master frame initializes them
        // from the LP settings; we reveal them on the 'initialized' message
        // (isGooglePayAvailable / isApplePayAvailable). No trigger call is needed —
        // the user clicks the native button inside the iframe.

        //handle iframes CSS
        await loadIframesCss();

        loading.style.display = 'none';
        return true;
    } catch (err) {
        console.error(err);
        loading.style.display = 'none';
        alert('Could not initialize payment: ' + err.message);
        return false;
    }
}

// Wallet payments no longer use a trigger call — the user clicks the native button
// inside the CardComGooglePay / CardComApplePay iframe, which opens the sheet and
// submits the token to Cardcom directly. Push cardholder details via
// setCardOwnerDetails so they reach the wallet sheets before payment.

function setCardOwnerDetails(e) {

    //update card holder details: name, email and phone 
    const data = {
        cardOwnerName: document.getElementById('cardOwnerName').value,
        cardOwnerEmail: document.getElementById('cardOwnerEmail').value,
        cardOwnerPhone: '054512345678',
    }
    const iframe = document.querySelector('#CardComMasterFrame')
    iframe.contentWindow.postMessage({ action: 'setCardOwnerDetails', data }, '*')
}

function submitForm(e) {
    const loading = document.getElementById('loading')
    const iframe = document.querySelector('#CardComMasterFrame')
    e.preventDefault()
    //Add your loading gif and start it here
    loading.style.display = 'flex'

    //Note: if you are using 3DS, it is now required to provide either the cardOwnerPhone or the cardOwnerEmail
    const formProps = {
        action: 'doTransaction',
        cardOwnerId: '000000000',//sending zeros to pass luhn algorithm check. If your terminal requires a valid card owner id, please provide it here.
        cardOwnerName: document.getElementById('cardOwnerName').value,
        cardOwnerEmail: document.getElementById('cardOwnerEmail').value,
        expirationMonth: document.getElementById('expirationMonth').value,
        expirationYear: document.getElementById('expirationYear').value,
        cardOwnerPhone: '054512345678',
        document: createDocument(),
        numberOfPayments: "1",
    }

    iframe.contentWindow.postMessage({
        ...formProps
    }, '*');

}


//this is an example of Document object as in https://secure.cardcom.solutions/swagger/index.html?url=/swagger/v11/swagger.json#tag/LowProfile/operation/LowProfile_Create
//Used for creating documents (invoice, etc)
function createDocument() {
    return {
        Name: "Cardcom",
        Email: "support@cardcom.solutions.co.il",
        IsSendByEmail: false,
        AddressLine1: "Harokmin 26",
        AddressLine2: "Azrieli Center",
        City: "Holon",
        Mobile: "054123465789",
        Phone: "03-9436100",
        Comments: "Your comments",
        IsVatFree: false,
        DepartmentId: 123,
        ExternalId: "external-id",
        IsAllowEditDocument: false,
        IsShowOnlyDocument: false,
        Language: "he",
        DocumentTypeToCreate: "Receipt", //see swagger for full list
        AdvancedDocumentDefinition: {
            IsAutoCreateUpdateAccount: "auto", //"true", "false", "auto"
            AccountForeignKey: "key",
            SiteUniqueId: "",
            AccountID: 1,
            IsLoadInfoFromAccountID: false
        },
        Products: [{
            ProductID: "ui-321",
            Description: "Description",
            Quantity: 1,
            UnitCost: 9.99,
            TotalLineCost: 9.99,
            IsVatFree: false
        }]
    }
}

/*
Those methods allow to validate the fields in the iframes, you can invoke them from your form validation logic.
Meant to allow you to enable / disable the "pay" button in your form according to the fields validations.
The result will return under "handleValidations" message with the field name and the result.
Same behavior occurs on focus out event of those the fields.
*/
function validateCvv() {
    const iframe = document.querySelector('#CardComMasterFrame');
    iframe.contentWindow.postMessage({ action: "validateCvv" }, '*');
}

function validateCardNumber() {
    const iframe = document.querySelector('#CardComMasterFrame');
    iframe.contentWindow.postMessage({ action: "validateCardNumber" }, '*');
}
