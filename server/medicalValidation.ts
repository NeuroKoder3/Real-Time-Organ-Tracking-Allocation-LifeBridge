interface OrganLike {
  organType: string;
  bloodType: string;
  hlaType?: { markers: string[] };
}

interface RecipientLike {
  organNeeded: string;
  bloodType: string;
  hlaType?: { markers: string[] };
  meldScore?: number;
  cpcScore?: number;
}

export function validateOrganRecipientCompatibility(
  organ: OrganLike,
  recipient: RecipientLike,
): string[] {
  const errors: string[] = [];

  if (!organ || !recipient) {
    errors.push("Organ and recipient are required.");
    return errors;
  }

  if (organ.organType !== recipient.organNeeded) {
    errors.push(
      `Organ type mismatch: Organ is '${organ.organType}', but recipient needs '${recipient.organNeeded}'`,
    );
  }

  if (!areBloodTypesCompatible(organ.bloodType, recipient.bloodType)) {
    errors.push(
      `Incompatible blood types: Donor ${organ.bloodType}, Recipient ${recipient.bloodType}`,
    );
  }

  // Optional: HLA compatibility
  if (organ.hlaType?.markers && recipient.hlaType?.markers) {
    const match = matchHlaMarkers(
      organ.hlaType.markers,
      recipient.hlaType.markers,
    );
    if (!match) {
      errors.push(
        "HLA markers are not sufficiently compatible (at least 3 common markers required).",
      );
    }
  }

  return errors;
}

function areBloodTypesCompatible(
  donorType: string,
  recipientType: string,
): boolean {
  const simplified = (bt: string) => bt.replace("+", "").replace("-", "");

  const compatibility: Record<string, string[]> = {
    O: ["O", "A", "B", "AB"],
    A: ["A", "AB"],
    B: ["B", "AB"],
    AB: ["AB"],
  };

  return (
    compatibility[simplified(donorType)]?.includes(simplified(recipientType)) ??
    false
  );
}

function matchHlaMarkers(
  donorMarkers: string[],
  recipientMarkers: string[],
): boolean {
  const matchCount = donorMarkers.filter((m) =>
    recipientMarkers.includes(m),
  ).length;
  return matchCount >= 3;
}
