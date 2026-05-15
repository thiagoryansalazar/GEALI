const sendBtn = document.getElementById("send-btn");
const userInput = document.getElementById("user-input");
const chatBody = document.getElementById("chat-body");

function addMessage(text, sender = "bot") {

    const div = document.createElement("div");

    div.classList.add("message");

    if(sender === "user"){
        div.classList.add("user");
    }else{
        div.classList.add("bot");
    }

    div.innerHTML = `
        ${text}
        <small>${new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        })}</small>
    `;

    chatBody.appendChild(div);

    chatBody.scrollTop = chatBody.scrollHeight;
}

async function sendMessage(){

    const message = userInput.value.trim();

    if(!message) return;

    addMessage(message, "user");

    userInput.value = "";

    try{

        const response = await fetch("/chat", {
            method:"POST",
            headers:{
                "Content-Type":"application/json"
            },
            body: JSON.stringify({
                message: message
            })
        });

        const data = await response.json();

        addMessage(data.reply);

    }catch(error){

        addMessage("Erro ao conectar com a IA.");
    }
}

sendBtn.addEventListener("click", sendMessage);

userInput.addEventListener("keydown", (e) => {
    if(e.key === "Enter"){
        sendMessage();
    }
});