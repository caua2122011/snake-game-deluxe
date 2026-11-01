# Snake Game Deluxe

Jogo da cobrinha para navegador, computador e celular.

**© 2026 Cauã Meneghetti dos Santos. Todos os direitos reservados.**

## Jogar pela internet
Depois de ativar o GitHub Pages, o jogo ficará disponível no endereço:

`https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/`

## Publicar com GitHub Pages
1. Crie um repositório no GitHub.
2. Envie todos os arquivos e pastas desta pasta para a raiz do repositório.
3. Abra **Settings > Pages**.
4. Em **Build and deployment**, escolha **Deploy from a branch**.
5. Selecione a branch `main` e a pasta `/(root)`.
6. Clique em **Save** e aguarde a publicação.

## Versão Windows (.EXE)
Os arquivos para gerar a versão portátil do Windows estão na pasta `versao-windows`.
Em um computador Windows com o compilador C# do .NET Framework disponível, execute `GERAR_EXE.bat`.
O executável `SnakeGameDeluxe.exe` será criado nessa mesma pasta.

## Arquivos principais
- `index.html`: página principal do jogo.
- `style.css`: aparência.
- `app.js`: lógica do jogo.
- `manifest.webmanifest` e `sw.js`: instalação PWA e funcionamento offline após a primeira visita, em ambiente compatível.
- `icons/`: ícones do aplicativo.
- `versao-windows/`: código e script para gerar o executável Windows.

## Observação sobre os recordes
O ranking da versão web fica salvo no navegador/dispositivo. Ele não é sincronizado automaticamente entre diferentes aparelhos.
