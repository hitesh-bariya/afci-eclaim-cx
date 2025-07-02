import {
  ECLAIM_DETAILS_OBJECT_ENDPOINT,
  ECLAIM_CLAIM_NUMBER_PREFIXES_OBJECT_ENDPOINT,
} from "../constants/constants";
import baseFetch from "../services/api";

interface EmployeeData {
  location: string;
  entity: string;
}

interface PrefixData {
  location: string;
  legalEntity: string;
  prefix: string;
  locationCode?: string;
  entity: string;
}

export const generateSequence = async (employeeData: EmployeeData) => {
  const currentDate = new Date();
  const year = currentDate.getFullYear().toString().slice(-2);
  const month = String(currentDate.getMonth() + 1).padStart(2, "0");

  let prefixes: PrefixData[] = [];
  try {
    const prefixesResponse = await baseFetch(
      `${ECLAIM_CLAIM_NUMBER_PREFIXES_OBJECT_ENDPOINT}?page=1&pageSize=1000`
    );

    if (prefixesResponse.ok) {
      const prefixesData = await prefixesResponse.json();
      prefixes =
        prefixesData.items?.map((item: any) => ({
          legalEntity: item.legalEntity,
          prefix: item.prefix,
          location: item.locationCode,
          entity: item.entityCode,
        })) || [];
    } else {
      throw new Error(`Failed to fetch prefixes: ${prefixesResponse.status}`);
    }
  } catch (error) {
    console.error("Error fetching prefixes:", error);
    throw error;
  }

  const matchedPrefix = prefixes.find(
    (prefix) =>
      prefix.location === employeeData.location &&
      prefix.entity === employeeData.entity
  );

  if (!matchedPrefix) {
    throw new Error(
      `No prefix found for location: ${employeeData.location} and entity: ${employeeData.entity}`
    );
  }

  const activePrefix = matchedPrefix.prefix;
  console.log(
    `Using prefix: ${activePrefix} for location: ${employeeData.location}, entity: ${employeeData.entity}`
  );

  let lastSequence = 0;
  try {
    const claimResponse = await baseFetch(
      `${ECLAIM_DETAILS_OBJECT_ENDPOINT}?page=1&pageSize=1000&sort=dateCreated:desc`
    );

    if (claimResponse.ok) {
      const claimData = await claimResponse.json();

      if (claimData.items?.length > 0) {
        const currentMonthEntries = claimData.items.filter((item: any) => {
          if (!item.claimNumber || !item.claimNumber.startsWith(activePrefix)) {
            return false;
          }
          const entryYearMonth = item.claimNumber.substring(
            activePrefix.length,
            activePrefix.length + 4
          );
          return entryYearMonth === `${year}${month}`;
        });

        if (currentMonthEntries.length > 0) {
          const lastEntry = currentMonthEntries[0];
          const lastSequenceStr = lastEntry.claimNumber.substring(
            activePrefix.length + 4
          );
          lastSequence = parseInt(lastSequenceStr) || 0;
        }
      }
    }
  } catch (error) {
    console.error("Error fetching last sequence:", error);
    throw error;
  }

  const nextSequence = String(lastSequence + 1).padStart(4, "0");
  const generatedNumber = `${activePrefix}${year}${month}${nextSequence}`;

  console.log(`Generated claim number: ${generatedNumber}`);
  return generatedNumber;
};
