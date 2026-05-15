# GEALI - AI Consultora Regulatória

Dashboard inteligente para consultoria regulatória de alimentos utilizando IA generativa.

---

## ✨ Features

* Chat inteligente com IA
* Interface moderna estilo SaaS
* Dashboard responsivo
* Sidebar interativa
* Integração com API LLM (Groq)
* Respostas em tempo real
* Estrutura Flask + Bootstrap

---

## 🖥️ Tecnologias

* Python
* Flask
* Bootstrap 5
* JavaScript
* HTML5
* CSS3
* Groq API
* Llama 3.1

---

## 📁 Estrutura do Projeto

```txt
project/
│
├── app.py
├── .env
├── requirements.txt
│
├── templates/
│   └── index.html
│
├── static/
│   ├── style.css
│   └── script.js
```

---

## ⚙️ Instalação

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/geali.git
```

### 2. Entre na pasta do projeto

```bash
cd geali
```

### 3. Instale as dependências

```bash
py -m pip install -r requirements.txt
```

---

## 🔑 Configuração da API

Crie um arquivo `.env` na raiz do projeto:

```env
GROQ_API_KEY=sua_api_key
```

Você pode obter uma chave gratuita em:

[https://console.groq.com/](https://console.groq.com/)

---

## ▶️ Executando o projeto

```bash
py app.py
```

Depois abra no navegador:

```txt
http://127.0.0.1:5000
```

---

## 🧠 Modelo utilizado

Atualmente o projeto utiliza:

```txt
llama-3.1-8b-instant
```

via API da Groq.

---

## 📌 Roadmap

* [ ] Histórico de conversas
* [ ] Upload de documentos
* [ ] Sistema de autenticação
* [ ] Geração de relatórios PDF
* [ ] Tema dark/light
* [ ] Integração com banco de dados
* [ ] Streaming de respostas

---

## 📄 Licença

Este projeto está sob a licença MIT.

---

## 👨‍💻 Autor

Desenvolvido por GEALI

---

## ⚠️ Importante

Nunca envie seu arquivo `.env` para o GitHub.

Crie também um arquivo `.gitignore`:

```gitignore
.env
__pycache__/
*.pyc
venv/
```
