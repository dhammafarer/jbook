import * as esbuild from "esbuild-wasm";
import { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { unpkgPathPlugin } from "./plugins/unpkg-path-plugin";
import { fetchPlugin } from "./plugins/fetch-plugin";

const App = () => {
  const ref = useRef<esbuild.Service | undefined>();
  const iframe = useRef<HTMLIFrameElement>(null);
  const [input, setInput] = useState("");

  const startService = async () => {
    ref.current = await esbuild.startService({
      worker: true,
      wasmURL: "https://unpkg.com/esbuild-wasm@0.8.27/esbuild.wasm",
    });
  };

  const onClick = async () => {
    if (!ref.current) {
      return;
    }

    if (iframe.current) {
      iframe.current.srcdoc = html;
    }

    const result = await ref.current.build({
      entryPoints: ["index.js"],
      bundle: true,
      write: false,
      plugins: [unpkgPathPlugin(), fetchPlugin(input)],
      define: {
        "process.env.NODE_ENV": '"production"',
        global: "window",
      },
    });

    if (iframe.current && iframe.current.contentWindow) {
      iframe.current.contentWindow.postMessage(result.outputFiles[0].text, "*");
    }
  };

  useEffect(() => {
    startService();
  }, []);

  const html = `
    <html>
      <head></head>
      <body>
        <div id="root"></div>
        <script>
          window.addEventListener("message", (event) => {
            try {
              eval(event.data);
            } catch (err) {
              const root = document.querySelector("#root");
              root.innerHTML = '<div style="color: red;"><h4>Runtime Error</h4>' + err + "</div>";
              console.error(err);
            }
          }, false);
        </script>
      </body>
    </html>
  `

  return (
    <div>
      <textarea
        style={{ width: "50%" }}
        onChange={(e) => setInput(e.target.value)}
      ></textarea>
      <div>
        <button onClick={onClick}>Submit</button>
      </div>
      <iframe ref={iframe} title="preview" sandbox="allow-scripts" srcDoc={html}/>
    </div>
  );
};

ReactDOM.render(<App />, document.querySelector("#root"));
