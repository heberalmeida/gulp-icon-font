### Documentação - Gulp Icone SVG para Font

#### Português

Este documento descreve como utilizar ícones SVG em tempo real em um projeto, usando o Gulp como ferramenta de automação. Você precisará ter instalado o `gulp-cli` e os pacotes necessários via `yarn`.

#### Instalação

1. Certifique-se de ter o Node.js instalado, preferencialmente na versão v18.19.0.
2. Instale o `gulp-cli` globalmente executando o seguinte comando no terminal:

    ```
    npm install -g gulp-cli
    ```

3. Instale os pacotes necessários para o projeto utilizando o Yarn:

    ```
    yarn install
    ```

#### Utilização

1. Após instalar as dependências, inicie o projeto executando o comando:

    ```
    gulp
    ```

2. Isso iniciará o processo de construção dos ícones e abrirá automaticamente o navegador com a visualização do projeto.
3. Na pasta `icons/svg`, adicione os arquivos SVG dos ícones que deseja utilizar.
4. Em tempo real, os ícones adicionados serão incorporados ao documento aberto no navegador.

#### Personalização dos ícones

Você pode nomear os arquivos SVG utilizando colchetes `[ ]` e incluir tags ou palavras-chave para facilitar a localização dos ícones na documentação. Por exemplo, um ícone com o nome `icone[carro, transporte]` terá as tags `carro` e `transporte` associadas a ele.

#### Arquivo `gulpfile.js`

O arquivo `gulpfile.js` contém as tarefas necessárias para processar os ícones SVG e incorporá-los ao projeto. Certifique-se de não alterar este arquivo, a menos que saiba o que está fazendo.

---

### Documentation - Gulp Icon SVG to Font

#### English

This document describes how to use SVG icons in real-time in a project, using Gulp as an automation tool. You'll need to have `gulp-cli` installed and required packages via `yarn`.

#### Installation

1. Ensure you have Node.js installed, preferably in version v18.19.0.
2. Install `gulp-cli` globally by running the following command in the terminal:

    ```
    npm install -g gulp-cli
    ```

3. Install the required packages for the project using Yarn:

    ```
    yarn install
    ```

#### Usage

1. After installing the dependencies, start the project by running the command:

    ```
    gulp
    ```

2. This will initiate the process of building the icons and automatically open the browser with the project preview.
3. In the `icons/svg` folder, add the SVG files of the icons you wish to use.
4. In real-time, the added icons will be incorporated into the document opened in the browser.

#### Customizing Icons

You can name SVG files using brackets `[ ]` and include tags or keywords to facilitate locating the icons in the documentation. For example, an icon named `icon[car, transportation]` will have the tags `car` and `transportation` associated with it.

#### `gulpfile.js` File

The `gulpfile.js` contains the tasks necessary to process the SVG icons and incorporate them into the project. Ensure not to alter this file unless you know what you're doing.
