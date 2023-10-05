document.addEventListener("DOMContentLoaded", () => {
    var lowProfileCode = undefined
    const firstSceen = document.getElementById('first-screen')
    const secondSceen = document.getElementById('second-screen')
    const iframe = document.querySelector('#CardComMasterFrame')
    const loading = document.getElementById('loading')

    var iframeMessage = {}
    document.getElementById('continue').addEventListener('click', nextScreen)

    function nextScreen() {
        //create a low profile deal 
        const url = "http://127.0.0.1:8000" //your backend url

        fetch(`${url}/init`).then(async res => {
            const json = await res.json()
            lowProfileCode = json.LowProfileId//add try / catch here - make sure you have the id. 

            //change displays
            firstSceen.style.display = 'none'
            secondSceen.style.display = 'block'

            //handle iframes CSS
            await loadIframesCss()

            //handle submition response: redirect / display succsess popup etc.
            window.addEventListener("message", handleFrameMessages)

            //one way of submitting the form
            handleFormSubmit()

        })
            .catch(err => {
                console.error(err)
                loading.style.display = 'none'
                alert('Could not create LP deal ', err)
            })
    }

    async function loadIframesCss() {
        /*
            You have several ways to fetch your CSS to be sent to CardCom iframe: regular *.css file, template element or plain text
            Eventually you need to send a string that represents valid CSS rules
        */

        // 1.Fetching CSS from files
        const cardCSSPromise = await fetch('../styles/cardNumber.css')
        const cardCssText = await cardCSSPromise.text()

        //2.In template element
        const template = document.getElementById('css_template').content.querySelector('style')

        //3.Store your CSS in a string variable 
        const inlineCSS = `body {
                            margin: 0
                        }
                        #cardNumber {
                            border: 1px solid #ccc
                            border-radius: 3px
                            width: 100%
                            height: 20px
                            margin: 0
                        }`

        //Note: props names are important
        iframeMessage = {
            action: 'init',
            cardFieldCSS: cardCssText,
            cvvFieldCSS: template.innerText.toString(),
            placeholder: "1111-2222-3333-4444",
            lowProfileCode: lowProfileCode,
        }

        //to prevent a race condition: will be fixed in the next version.
        setTimeout(() => {
            iframe.contentWindow.postMessage(iframeMessage, '*')
        }, 1000)

    }

    function handleFrameMessages(message) {
        //add validations here that the message came from secure.cardcom.solutions
        const msg = message.data

        switch (msg.action) {
            case "HandleSubmit":
                //redirect to your succssess page here
                handleSubmitResult(msg.data)
                break
            case "HandleEror":
                //redirect to your error page / display error popup here
                loading.style.display = 'none'
                alert(msg.message)
                break
            default:
                break
        }
    }

    function handleSubmitResult(data) {
        loading.style.display = 'none'
        if (data.IsSuccess)
            alert(data.Description)
        else
            alert("Deal failed")
    }

    function handleFormSubmit() {
        const form = document.getElementById('form')
        form.addEventListener("submit", (e) => {
            submitForm(e)
        })
    }
})

function submitForm(e) {
    const loading = document.getElementById('loading')
    const iframe = document.querySelector('#CardComMasterFrame')
    e.preventDefault()
    //Add your loading gif and start it here
    loading.style.display = 'flex'

    const formProps = {
        action: 'doTransaction',
        cardOwnerId: 123465789,
        cardOwnerName: document.getElementById('cardOwnerName').value,
        cardOwnerEmail: document.getElementById('cardOwnerEmail').value,
        expirationMonth: document.getElementById('expirationMonth').value,
        expirationYear: document.getElementById('expirationYear').value,
        numberOfPayments: "1",
    }

    iframe.contentWindow.postMessage({
        ...formProps
    }, '*')
}