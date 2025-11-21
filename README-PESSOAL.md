# 🔐 Tela de Autenticação - Planeja AI

Sistema de login e cadastro com interface moderna.

## 📁 O que foi criado

```
app/auth/page.tsx           # Página principal de autenticação
components/ui/
├── card.tsx               # Card container
├── button.tsx            # Botões
├── input.tsx             # Campos de entrada
└── label.tsx             # Rótulos
```

## ✨ Funcionalidades

- **Card único** que alterna entre Login e Cadastro
- **Login**: Email + Senha
- **Cadastro**: Nome + Email + Senha
- **Dados salvos** em useState (temporário)
- **Design responsivo**

## 🚀 Como usar

1. Execute o projeto:

```bash
npm run dev
```

2. Acesse: `http://localhost:3000/auth`

## 📊 Estados atuais

```typescript
// Login
const [loginData, setLoginData] = useState({
  email: "",
  password: "",
});

// Cadastro
const [registerData, setRegisterData] = useState({
  name: "",
  email: "",
  password: "",
});
```

## 🔜 Próximos passos

Para conectar com backend, substitua os `console.log` nas funções `handleLoginSubmit` e `handleRegisterSubmit` por chamadas de API:

```typescript
// Exemplo
const handleLoginSubmit = async (e) => {
  e.preventDefault();

  const response = await fetch("/api/login", {
    method: "POST",
    body: JSON.stringify(loginData),
  });

  // Processar resposta...
};
```

## 🎨 Componentes principais

- **Card**: Container principal com bordas e sombra
- **Button**: Botão com hover effects
- **Input**: Campo de entrada estilizado
- **Label**: Rótulo para acessibilidade

---

**Pronto para integração com o backend!** 🚀

👨‍💻 Autor
Desenvolvido por Luís Felipe Mozer Chiqueto
