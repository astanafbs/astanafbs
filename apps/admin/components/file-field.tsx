export function ImageField({
  name,
  label = 'Фото',
  defaultValue,
}: {
  name: string;
  label?: string;
  defaultValue?: string;
}) {
  return (
    <label className="field file-field">
      <span>{label}</span>
      <input className="input" name={name} defaultValue={defaultValue} placeholder="https://... или storage URL" />
      <input className="file-input" name={`${name}File`} type="file" accept="image/*" />
      <small>Можно выбрать файл или вставить готовый URL.</small>
    </label>
  );
}

export function ImagesField({
  name,
  label = 'Фото',
  defaultValue,
}: {
  name: string;
  label?: string;
  defaultValue?: string;
}) {
  return (
    <label className="field file-field">
      <span>{label}</span>
      <input className="input" name={name} defaultValue={defaultValue} placeholder="URL через запятую" />
      <input className="file-input" name={`${name}Files`} type="file" accept="image/*" multiple />
      <small>Можно выбрать один или несколько файлов, либо оставить список URL.</small>
    </label>
  );
}
