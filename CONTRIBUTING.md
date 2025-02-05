# Contributing

## Development

The following instructions show how to develop in Docker with VSCode devcontainer extension (recommended).

1. Clone this repo

    ```
    git clone <repo-url>
    ```

2. Open repo directory with VSCode

    ```
    cd <repo-name>

    code .
    ```

3. Click the "Reopen in container" button (wait 3~5 mins)

4. When VSCode ready, open the terminal and run `node-red` command to init some files. Then press `Ctrl-C` to exit.

    ```
    node-red

    Ctrl-C
    ```

5. Install dependencies

    ```
    npm install
    ```

6. Link the current directory

    ```
    pkgpath=$(pwd) && cd ~/.node-red && npm install $pkgpath && cd -
    ```

7. Start dev server

    ```
    npm run dev
    ```

> If you run Docker on Windows, use `npm run dev-win` command instead.

There will be two ports open:

* `1880` - Original Node-RED
* `3000` - dev server
