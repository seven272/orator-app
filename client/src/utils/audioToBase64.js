const audioToBase64 = async (audioFile) => {
  return new Promise((resolve, reject) => {
    let reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => resolve(e.target.result);
    reader.readAsDataURL(audioFile);
  });
}

export default audioToBase64