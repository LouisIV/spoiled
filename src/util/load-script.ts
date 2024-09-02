// Function to dynamically load a script and return a promise
export function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    // Create a new script element
    const script = document.createElement("script");

    // Set the type to "text/javascript"
    script.type = "text/javascript";

    // Set the source URL of the script
    script.src = src;

    // Set up an event listener for when the script is loaded
    script.onload = () => {
      resolve(); // Resolve the promise when the script is loaded
    };

    // Set up an event listener for when there's an error loading the script
    script.onerror = () => {
      reject(new Error(`Error loading script: ${src}`)); // Reject the promise if there's an error
    };

    // Append the script to the <head> (or <body>)
    document.head.appendChild(script);
  });
}
