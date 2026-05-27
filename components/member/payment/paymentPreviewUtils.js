function normalizeOcrCandidate(candidate) {
  return String(candidate || '')
    .replace(/[Oo]/g, '0')
    .replace(/[^0-9\s-]/g, '')
    .replace(/[-\s]+/g, ' ')
    .trim();
}

function normalizeCompactReference(candidate) {
  return normalizeOcrCandidate(candidate).replace(/\s+/g, '');
}

function extractReferenceCodeFromText(text) {
  const compactText = String(text || '')
    .replace(/\r/g, '\n')
    .replace(/\s+/g, ' ')
    .trim();

  const labeledMatch = compactText.match(/ref(?:erence)?\s*(?:no|number)?\.?\s*[:#-]?\s*([0-9Oo][0-9Oo\s-]{6,24})/i);
  if (labeledMatch) {
    return normalizeOcrCandidate(labeledMatch[1]);
  }

  const groupedMatch = compactText.match(/\b[0-9Oo]{3,4}(?:[\s-][0-9Oo]{3,4}){1,4}\b/);
  if (groupedMatch) {
    return normalizeOcrCandidate(groupedMatch[0]);
  }

  const denseMatch = compactText.match(/\b[0-9Oo]{10,16}\b/);
  if (denseMatch) {
    return normalizeOcrCandidate(denseMatch[0]);
  }

  return '';
}

function unionBounds(words) {
  if (!words.length) {
    return null;
  }

  const left = Math.min(...words.map((word) => word.bbox.x0));
  const top = Math.min(...words.map((word) => word.bbox.y0));
  const right = Math.max(...words.map((word) => word.bbox.x1));
  const bottom = Math.max(...words.map((word) => word.bbox.y1));

  return {
    x: left,
    y: top,
    width: right - left,
    height: bottom - top,
  };
}

function groupWordsIntoLines(words) {
  const sortedWords = [...words].sort((left, right) => {
    const topDifference = left.bbox.y0 - right.bbox.y0;
    return Math.abs(topDifference) > 10 ? topDifference : left.bbox.x0 - right.bbox.x0;
  });
  const lines = [];

  sortedWords.forEach((word) => {
    const centerY = (word.bbox.y0 + word.bbox.y1) / 2;
    const currentLine = lines.at(-1);

    if (!currentLine || Math.abs(centerY - currentLine.centerY) > 14) {
      lines.push({ centerY, words: [word] });
      return;
    }

    currentLine.words.push(word);
    currentLine.centerY = (currentLine.centerY + centerY) / 2;
  });

  return lines.map((line) => {
    const lineWords = line.words.sort((left, right) => left.bbox.x0 - right.bbox.x0);

    return {
      words: lineWords,
      text: lineWords.map((word) => word.text).join(' '),
      compact: normalizeCompactReference(lineWords.map((word) => word.text).join(' ')),
      bounds: unionBounds(lineWords),
    };
  });
}

function countOrderedDigitMatches(source, target) {
  if (!source || !target) {
    return 0;
  }

  let position = 0;
  let matches = 0;

  for (const character of target) {
    const nextIndex = source.indexOf(character, position);
    if (nextIndex === -1) {
      continue;
    }

    matches += 1;
    position = nextIndex + 1;
  }

  return matches;
}

function getLineBounds(line, target) {
  const lineWords = Array.isArray(line?.words) ? line.words.filter((word) => word?.text && word?.bbox) : [];
  if (!lineWords.length) {
    return line?.bbox
      ? {
        x: line.bbox.x0,
        y: line.bbox.y0,
        width: line.bbox.x1 - line.bbox.x0,
        height: line.bbox.y1 - line.bbox.y0,
      }
      : null;
  }

  const targetPrefix = target.slice(0, Math.min(4, target.length));
  const targetSuffix = target.slice(-Math.min(6, target.length));
  const focusedWords = lineWords.filter((word) => {
    const compact = normalizeCompactReference(word.text);
    if (/ref|reference|no\.?/i.test(word.text)) {
      return true;
    }

    if (compact.length < 3) {
      return false;
    }

    return target.includes(compact)
      || compact.includes(targetPrefix)
      || compact.includes(targetSuffix)
      || countOrderedDigitMatches(compact, target) >= Math.min(compact.length, 4);
  });

  return unionBounds(focusedWords.length ? focusedWords : lineWords);
}

function scoreReferenceText(text, target) {
  const compact = normalizeCompactReference(text);
  if (!compact) {
    return 0;
  }

  const digitCount = (compact.match(/\d/g) || []).length;
  const orderedMatches = countOrderedDigitMatches(compact, target);
  const labelBoost = /ref|reference/i.test(text) ? 8 : 0;
  const exactBoost = compact.includes(target) || target.includes(compact) ? 18 : 0;
  const suffixBoost = target && compact.includes(target.slice(-Math.min(6, target.length))) ? 6 : 0;

  return labelBoost + exactBoost + suffixBoost + (orderedMatches * 2) + Math.min(digitCount, 12);
}

function findReferenceRegion(words, lines, extractedCode) {
  const target = normalizeCompactReference(extractedCode);
  if (!target || !Array.isArray(words) || words.length === 0) {
    if (!target || !Array.isArray(lines) || lines.length === 0) {
      return null;
    }
  }

  const normalizedLines = Array.isArray(lines)
    ? lines
      .filter((line) => line?.text && line?.bbox)
      .map((line) => ({
        text: line.text,
        score: scoreReferenceText(line.text, target),
        bounds: getLineBounds(line, target),
      }))
      .filter((line) => line.bounds)
      .sort((left, right) => right.score - left.score)
    : [];

  if (normalizedLines[0]?.score >= 6) {
    return normalizedLines[0].bounds;
  }

  if (!Array.isArray(words) || words.length === 0) {
    return normalizedLines[0]?.bounds || null;
  }

  const normalizedWords = words
    .filter((word) => word?.text && word?.bbox)
    .map((word) => ({
      text: word.text,
      bbox: word.bbox,
      compact: normalizeCompactReference(word.text),
    }));

  const bestLine = groupWordsIntoLines(normalizedWords)
    .map((line) => {
      const focusedWords = line.words.filter((word) => {
        const compact = normalizeCompactReference(word.text);
        return /ref|reference|no\.?/i.test(word.text)
          || (compact.length >= 3 && target.includes(compact))
          || countOrderedDigitMatches(compact, target) >= Math.min(compact.length, 4);
      });

      return {
        score: scoreReferenceText(line.text, target),
        bounds: unionBounds(focusedWords.length ? focusedWords : line.words),
      };
    })
    .sort((left, right) => right.score - left.score)[0];

  if (bestLine?.score >= 4) {
    return bestLine.bounds;
  }

  return normalizedLines[0]?.bounds || null;
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Failed to load the selected receipt image.'));
    image.src = url;
  });
}

async function createReceiptPreview(file, region) {
  const sourceUrl = URL.createObjectURL(file);
  const image = await loadImage(sourceUrl);

  if (!region) {
    return {
      sourceUrl,
      cropUrl: '',
      imageWidth: image.naturalWidth,
      imageHeight: image.naturalHeight,
      frame: null,
    };
  }

  const cropWidth = Math.min(image.naturalWidth, Math.max(Math.ceil(region.width * 1.75), 250));
  const cropHeight = Math.min(image.naturalHeight, Math.max(Math.ceil(region.height * 2.8), 96));
  const centerX = region.x + (region.width / 2);
  const centerY = region.y + (region.height / 2);
  const cropX = Math.max(0, Math.min(Math.floor(centerX - (cropWidth / 2)), image.naturalWidth - cropWidth));
  const cropY = Math.max(0, Math.min(Math.floor(centerY - (cropHeight / 2)), image.naturalHeight - cropHeight));
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  canvas.width = cropWidth;
  canvas.height = cropHeight;

  if (!context) {
    throw new Error('Failed to prepare the cropped receipt preview.');
  }

  context.drawImage(image, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

  return {
    sourceUrl,
    cropUrl: canvas.toDataURL('image/jpeg', 0.92),
    imageWidth: image.naturalWidth,
    imageHeight: image.naturalHeight,
    frame: {
      x: region.x,
      y: region.y,
      width: region.width,
      height: region.height,
    },
  };
}

export function createPaymentForm(today, defaultLoanId) {
  return {
    loan_id: defaultLoanId || '',
    amount_received: '',
    payment_date: today,
    payment_method: 'gcash',
    reference_code: '',
  };
}

export async function scanReceiptForReference(file) {
  const tesseractModule = await import('tesseract.js');
  const result = await tesseractModule.recognize(file, 'eng', {
    logger: () => {},
  });
  const extractedCode = extractReferenceCodeFromText(result.data?.text || '');
  const region = findReferenceRegion(result.data?.words || [], result.data?.lines || [], extractedCode);
  const preview = await createReceiptPreview(file, region);

  return {
    ...preview,
    extractedCode,
    hasFocusedCrop: Boolean(preview.cropUrl),
  };
}

export function revokeReceiptPreview(preview) {
  if (preview?.sourceUrl) {
    URL.revokeObjectURL(preview.sourceUrl);
  }
}