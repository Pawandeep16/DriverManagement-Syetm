import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  DocumentData,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";
import { Driver, PunchLog, ReturnForm, User } from "./types";

//
// 🔹 Helpers
//
const mapDoc = <T>(
  snapshot: QueryDocumentSnapshot<DocumentData>,
  dateFields: string[] = []
): T => {
  const data = snapshot.data();
  dateFields.forEach((f) => {
    if (data[f]?.toDate) {
      data[f] = data[f].toDate();
    }
  });
  return { id: snapshot.id, ...data } as T;
};

//
// 🔹 User operations
//
export const createUser = async (
  userData: Omit<User, "id">
): Promise<User> => {
  try {
    const docRef = await addDoc(collection(db, "users"), {
      ...userData,
      createdAt: Timestamp.now(),
    });
    return { id: docRef.id, ...userData };
  } catch (err) {
    console.error("Error creating user:", err);
    throw err;
  }
};

export const getUser = async (id: string): Promise<User | null> => {
  try {
    const docRef = doc(db, "users", id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? mapDoc<User>(docSnap, ["createdAt"]) : null;
  } catch (err) {
    console.error("Error getting user:", err);
    return null;
  }
};

export const updateUser = async (
  id: string,
  updates: Partial<User>
): Promise<void> => {
  try {
    const docRef = doc(db, "users", id);
    await updateDoc(docRef, updates);
  } catch (err) {
    console.error("Error updating user:", err);
    throw err;
  }
};

//
// 🔹 Driver operations
//
export const createDriver = async (
  driverData: Omit<Driver, "id">
): Promise<Driver> => {
  try {
    const docRef = await addDoc(collection(db, "drivers"), {
      ...driverData,
      createdAt: Timestamp.now(),
      isActive: true,
    });
    return {
      id: docRef.id,
      ...driverData,
      createdAt: new Date(),
      isActive: true,
    };
  } catch (err) {
    console.error("Error creating driver:", err);
    throw err;
  }
};

export const getDriver = async (id: string): Promise<Driver | null> => {
  try {
    const docRef = doc(db, "drivers", id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? mapDoc<Driver>(docSnap, ["createdAt"]) : null;
  } catch (err) {
    console.error("Error getting driver:", err);
    return null;
  }
};


export async function getDriverByDriverId(driverId: string) {
  try {
    const q = query(
      collection(db, "users"), // ✅ use "users", not "drivers"
      where("driverId", "==", driverId),
      where("role", "==", "driver") // optional: only drivers
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.warn("No driver found with driverId:", driverId);
      return null;
    }

    return {
      id: snapshot.docs[0].id,
      ...snapshot.docs[0].data(),
    };
  } catch (err) {
    console.error("Error fetching driver:", err);
    return null;
  }
}
export const getDrivers = async (): Promise<Driver[]> => {
  try {
    const q = query(collection(db, "drivers"), orderBy("name"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => mapDoc<Driver>(doc, ["createdAt"]));
  } catch (err) {
    console.error("Error fetching drivers:", err);
    return [];
  }
};

export const updateDriver = async (
  id: string,
  updates: Partial<Driver>
): Promise<void> => {
  try {
    const docRef = doc(db, "drivers", id);
    await updateDoc(docRef, updates);
  } catch (err) {
    console.error("Error updating driver:", err);
    throw err;
  }
};

export const deleteDriver = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, "drivers", id);
    await deleteDoc(docRef);
  } catch (err) {
    console.error("Error deleting driver:", err);
    throw err;
  }
};

//
// 🔹 Punch log operations
//
export const createPunchLog = async (
  logData: Omit<PunchLog, "id">
): Promise<PunchLog> => {
  try {
    const docRef = await addDoc(collection(db, "punchLogs"), {
      ...logData,
      timestamp: Timestamp.fromDate(logData.timestamp),
    });
    return { id: docRef.id, ...logData };
  } catch (err) {
    console.error("Error creating punch log:", err);
    throw err;
  }
};

export const getPunchLogs = async (
  driverId?: string
): Promise<PunchLog[]> => {
  try {
    let q = query(collection(db, "punchLogs"), orderBy("timestamp", "desc"));
    if (driverId) {
      q = query(
        collection(db, "punchLogs"),
        where("driverId", "==", driverId),
        orderBy("timestamp", "desc")
      );
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => mapDoc<PunchLog>(doc, ["timestamp"]));
  } catch (err) {
    console.error("Error fetching punch logs:", err);
    return [];
  }
};

export const getLastPunchLog = async (
  driverId: string
): Promise<PunchLog | null> => {
  try {
    const q = query(
      collection(db, "punchLogs"),
      where("driverId", "==", driverId),
      orderBy("timestamp", "desc"),
      limit(1)
    );
    const snapshot = await getDocs(q);

    return snapshot.empty ? null : mapDoc<PunchLog>(snapshot.docs[0], ["timestamp"]);
  } catch (err) {
    console.error("Error fetching last punch log:", err);
    return null;
  }
};

//
// 🔹 Return form operations
//
export const createReturnForm = async (
  formData: Omit<ReturnForm, "id">
): Promise<ReturnForm> => {
  try {
    const docRef = await addDoc(collection(db, "returnForms"), {
      ...formData,
      submittedAt: Timestamp.fromDate(formData.submittedAt),
    });
    return { id: docRef.id, ...formData };
  } catch (err) {
    console.error("Error creating return form:", err);
    throw err;
  }
};

export const getReturnForms = async (
  driverId?: string
): Promise<ReturnForm[]> => {
  try {
    let q = query(
      collection(db, "returnForms"),
      orderBy("submittedAt", "desc")
    );
    if (driverId) {
      q = query(
        collection(db, "returnForms"),
        where("driverId", "==", driverId),
        orderBy("submittedAt", "desc")
      );
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => mapDoc<ReturnForm>(doc, ["submittedAt"]));
  } catch (err) {
    console.error("Error fetching return forms:", err);
    return [];
  }
};

export const updateReturnForm = async (
  id: string,
  updates: Partial<ReturnForm>
): Promise<void> => {
  try {
    const docRef = doc(db, "returnForms", id);
    await updateDoc(docRef, updates);
  } catch (err) {
    console.error("Error updating return form:", err);
    throw err;
  }
};

//
// 🔹 Real-time listeners
//
export const subscribeToReturnForms = (
  callback: (forms: ReturnForm[]) => void
) => {
  const q = query(collection(db, "returnForms"), orderBy("submittedAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const forms = snapshot.docs.map((doc) =>
      mapDoc<ReturnForm>(doc, ["submittedAt"])
    );
    callback(forms);
  });
};

export const subscribeToPunchLogs = (callback: (logs: PunchLog[]) => void) => {
  const q = query(collection(db, "punchLogs"), orderBy("timestamp", "desc"));
  return onSnapshot(q, (snapshot) => {
    const logs = snapshot.docs.map((doc) =>
      mapDoc<PunchLog>(doc, ["timestamp"])
    );
    callback(logs);
  });
};
