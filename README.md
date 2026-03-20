# 📢 DP NEWS — Quadro de Avisos

Sistema web de quadro de avisos corporativo com painel administrativo, desenvolvido em HTML, CSS, JavaScript e PHP.

---

## 🖥️ Telas

### Quadro Público (`index.html`)
- Exibe todos os avisos ativos em tempo real
- Avisos **urgentes** destacados com tag vermelha
- Filtro automático de avisos expirados
- Recarregamento automático a cada **90 segundos**
- Relógio em tempo real

### Painel Admin (`admin.html`)
- Acesso protegido por senha
- Cadastrar, editar e excluir avisos
- Campo de descrição com suporte a **HTML**
- Marcação de aviso como **URGENTE**
- Definição de **prazo de validade** (data + hora)
- Avisos expirados ficam opacos na listagem

---

## ⚙️ Tecnologias

| Camada | Tecnologia |
|--------|-----------|
| Frontend | HTML5, CSS3, JavaScript puro (sem frameworks) |
| Backend | PHP 7+ |
| Banco de dados | `avisos.json` (arquivo no servidor) |
| Ícones | Unicode / Emoji (sem dependências externas) |

---

## 📁 Estrutura de Arquivos

```
dp_avisos/
├── index.html      # Tela pública — quadro de avisos
├── admin.html      # Painel administrativo
├── api.php         # API backend (lê e grava avisos.json)
├── avisos.json     # Gerado automaticamente na 1ª vez
└── README.md
```

---

## 🚀 Deploy

### Requisitos do servidor
- PHP 7.0 ou superior
- Permissão de escrita na pasta (`chmod 755`)

### Passos

1. Faça upload dos arquivos para a raiz do domínio:
   ```
   index.html
   admin.html
   api.php
   ```

2. Acesse o site pelo domínio — o `avisos.json` é criado automaticamente no primeiro cadastro.

3. Se aparecer erro de permissão, crie o arquivo manualmente via cPanel e defina permissão `644`:
   ```
   avisos.json  →  644
   pasta/       →  755
   ```

### Teste local com XAMPP

1. Instale o [XAMPP](https://www.apachefriends.org/)
2. Copie a pasta para `C:\xampp\htdocs\dp_avisos\`
3. Inicie o Apache no painel do XAMPP
4. Acesse `http://localhost/dp_avisos/`

---

## 🔐 Senha do Admin

A senha padrão está definida na variável `SENHA` dentro do `admin.html`:

```javascript
var SENHA = 'Dpj255343';
```

Para alterar, edite essa linha diretamente no arquivo.

> ⚠️ A autenticação é feita no lado do cliente. Para ambientes com dados sensíveis, recomenda-se proteger o `admin.html` via `.htpasswd` no servidor.

---

## 📡 API

O arquivo `api.php` expõe os seguintes endpoints:

| Método | URL | Descrição |
|--------|-----|-----------|
| `GET` | `api.php?action=list` | Lista todos os avisos |
| `POST` | `api.php?action=save` | Cria novo aviso |
| `POST` | `api.php?action=update` | Atualiza aviso existente |
| `POST` | `api.php?action=delete` | Remove aviso |

### Estrutura de um aviso (JSON)

```json
{
  "id": 1711234567890,
  "titulo": "Reunião obrigatória",
  "descricao": "Sala 3 às 14h.",
  "data": "2025-03-20",
  "dataValidade": "2025-03-20",
  "horaValidade": "14:00",
  "urgente": true,
  "criadoEm": "2025-03-20T10:00:00-03:00"
}
```

---

## 🎨 Identidade Visual

| Cor | Hex | Uso |
|-----|-----|-----|
| Amarelo principal | `#FFCC00` | Sidebar, destaques, botões |
| Amarelo hover | `#F7C600` | Hover de botões |
| Preto | `#000000` | Textos, fundo sidebar icons |
| Branco | `#FFFFFF` | Fundo cards |
| Vermelho | `#dc3545` | Avisos urgentes |

---

## 👨‍💻 Desenvolvedor

**Jordão Nunes**

---

## 📝 Licença

Uso interno — DP NEWS © 2025
