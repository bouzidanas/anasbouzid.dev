/**
 * Text set one character per box loses the font's kerning, since a browser only kerns letters it lays out together.
 * This measures each pair as plain text and puts the difference back as a margin, in em so it holds at any size.
 * Call it once the font has loaded.
 */
export function keepKerning(element: HTMLElement) {
  const characters = [...element.querySelectorAll<HTMLElement>("[data-i]")];
  const probe = document.createElement("span");
  probe.ariaHidden = "true";
  probe.style.cssText = `position: absolute; visibility: hidden; white-space: pre; letter-spacing: 0;
    font-weight: ${getComputedStyle(element).fontWeight}`;
  element.append(probe);

  const width = (text: string) => {
    probe.textContent = text;
    return probe.getBoundingClientRect().width;
  };
  const size = parseFloat(getComputedStyle(probe).fontSize);
  const text = characters.map((character) => character.textContent!);

  characters.forEach((character, i) => {
    if (i === 0) return;
    const kerning = width(text[i - 1] + text[i]) - width(text[i - 1]) - width(text[i]);
    character.style.marginLeft = `${kerning / size}em`;
  });
  probe.remove();
}
