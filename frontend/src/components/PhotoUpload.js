export function createPhotoUpload(onPhotoSelected) {
  const wrapper = document.createElement("div");
  wrapper.className = "photo-upload";

  const label = document.createElement("label");
  label.textContent = "Attach or capture photo:";
  label.setAttribute("for", "photo-input");

  const input = document.createElement("input");
  input.type = "file";
  input.id = "photo-input";
  input.accept = "image/*";
  input.capture = "environment";
  input.addEventListener("change", () => {
    const file = input.files?.[0];
    if (!file) return;
    onPhotoSelected({
      fileName: file.name,
      fileType: file.type,
      size: file.size,
    });
  });

  wrapper.append(label, input);
  return wrapper;
}
