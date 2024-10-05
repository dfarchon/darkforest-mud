self.onmessage = (event) => {
  const data = event.data;
  const result = data * 2;
  self.postMessage(result);
};
