"use client";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  updateDoc,
} from "firebase/firestore";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  auth,
  db,
} from "@/lib/firebase";

import {
  onAuthStateChanged,
} from "firebase/auth";

import { useRouter } from "next/navigation";

import Image from "next/image";

import {
  Search,
  RefreshCcw,
  User,
  MapPin,
  Phone,
  Mail,
  Shield,
  Ban,
  CheckCircle2,
} from "lucide-react";

// =========================
// HELPERS
// =========================

const formatDate = (
  date: any
) => {
  try {
    if (!date)
      return "No Date";

    if (date?.toDate) {
      return date
        .toDate()
        .toLocaleString();
    }

    return new Date(
      date
    ).toLocaleString();
  } catch {
    return "Invalid Date";
  }
};

// =========================
// PAGE
// =========================

export default function AdminCustomersPage() {
  const router = useRouter();

  const [authorized, setAuthorized] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [customers, setCustomers] =
    useState<any[]>([]);

  const [
    filteredCustomers,
    setFilteredCustomers,
  ] = useState<any[]>([]);

  const [expanded, setExpanded] =
    useState<any>({});

  const [search, setSearch] =
    useState("");

  // PAGINATION
  const [lastDoc, setLastDoc] =
    useState<any>(null);

  const [hasMore, setHasMore] =
    useState(true);

  const [loadingMore, setLoadingMore] =
    useState(false);

  // =========================
  // ADMIN AUTH
  // =========================

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (user) => {
          try {
            if (!user) {
              router.push(
                "/admin-login"
              );

              return;
            }

            const adminDoc =
              await getDoc(
                doc(
                  db,
                  "admins",
                  user.uid
                )
              );

            if (
              !adminDoc.exists()
            ) {
              router.push("/");

              return;
            }

            const adminData =
              adminDoc.data();

            if (
              adminData.role !==
              "admin"
            ) {
              router.push("/");

              return;
            }

            setAuthorized(true);

            fetchCustomers();
          } catch (error) {
            console.error(error);

            router.push("/");
          }
        }
      );

    return () => unsubscribe();
  }, []);

  // =========================
  // FETCH CUSTOMERS
  // =========================

  const fetchCustomers =
    useCallback(async () => {
      try {
        setLoading(true);

        const customersQuery =
          query(
            collection(
              db,
              "customers"
            ),
            orderBy(
              "createdAt",
              "desc"
            ),
            limit(20)
          );

        const snapshot =
          await getDocs(
            customersQuery
          );

        const data =
          snapshot.docs.map(
            (doc) => ({
              id: doc.id,
              ...doc.data(),
            })
          );

        setCustomers(data);

        setFilteredCustomers(
          data
        );

        // LAST DOC
        const lastVisible =
          snapshot.docs[
            snapshot.docs.length -
              1
          ];

        setLastDoc(lastVisible);

        setHasMore(
          snapshot.docs.length ===
            20
        );

      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }, []);

  // =========================
  // LOAD MORE
  // =========================

  const loadMore =
    async () => {
      try {
        if (
          !lastDoc ||
          loadingMore
        )
          return;

        setLoadingMore(true);

        const nextQuery =
          query(
            collection(
              db,
              "customers"
            ),
            orderBy(
              "createdAt",
              "desc"
            ),
            startAfter(
              lastDoc
            ),
            limit(20)
          );

        const snapshot =
          await getDocs(
            nextQuery
          );

        const newCustomers =
          snapshot.docs.map(
            (doc) => ({
              id: doc.id,
              ...doc.data(),
            })
          );

        // UPDATE LAST DOC
        const lastVisible =
          snapshot.docs[
            snapshot.docs.length -
              1
          ];

        setLastDoc(
          lastVisible
        );

        setHasMore(
          snapshot.docs.length ===
            20
        );

        setCustomers((prev) => [
          ...prev,
          ...newCustomers,
        ]);

      } catch (error) {
        console.error(error);
      } finally {
        setLoadingMore(false);
      }
    };

  // =========================
  // FILTERS
  // =========================

  useEffect(() => {
    let updated = [
      ...customers,
    ];

    if (search) {
      updated =
        updated.filter(
          (customer) =>
            customer.name
              ?.toLowerCase()
              .includes(
                search.toLowerCase()
              ) ||
            customer.email
              ?.toLowerCase()
              .includes(
                search.toLowerCase()
              ) ||
            customer.phone?.includes(
              search
            )
        );
    }

    setFilteredCustomers(
      updated
    );
  }, [customers, search]);

  // =========================
  // BLOCK CUSTOMER
  // =========================

  const toggleBlock =
    async (
      customerId: string,
      blocked: boolean
    ) => {
      try {
        await updateDoc(
          doc(
            db,
            "customers",
            customerId
          ),
          {
            isBlocked:
              !blocked,
          }
        );

        setCustomers((prev) =>
          prev.map(
            (customer) => {
              if (
                customer.id ===
                customerId
              ) {
                return {
                  ...customer,
                  isBlocked:
                    !blocked,
                };
              }

              return customer;
            }
          )
        );
      } catch (error) {
        console.error(error);
      }
    };

  // =========================
  // UPDATE FIELD
  // =========================

  const updateField =
    async (
      customerId: string,
      field: string,
      value: any
    ) => {
      try {
        await updateDoc(
          doc(
            db,
            "customers",
            customerId
          ),
          {
            [field]: value,
          }
        );

        setCustomers((prev) =>
          prev.map(
            (customer) => {
              if (
                customer.id ===
                customerId
              ) {
                return {
                  ...customer,
                  [field]:
                    value,
                };
              }

              return customer;
            }
          )
        );
      } catch (error) {
        console.error(error);
      }
    };

  // =========================
  // ANALYTICS
  // =========================

  const analytics =
    useMemo(() => {
      return {
        total:
          customers.length,

        blocked:
          customers.filter(
            (c) =>
              c.isBlocked
          ).length,

        active:
          customers.filter(
            (c) =>
              !c.isBlocked
          ).length,
      };
    }, [customers]);

  // =========================
  // LOADING
  // =========================

  if (
    loading ||
    !authorized
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xl font-bold">
        Checking Admin
        Access...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7FB] p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col xl:flex-row justify-between gap-5 mb-8">
          <div>
            <h1 className="text-4xl font-black text-gray-900">
              Customers
              Management
            </h1>

            <p className="text-gray-500 mt-2 text-lg">
              Manage all
              customers
            </p>
          </div>

          <button
            onClick={
              fetchCustomers
            }
            className="bg-white px-5 py-3 rounded-2xl font-semibold flex items-center gap-2 shadow-sm"
          >
            <RefreshCcw
              size={18}
            />
            Refresh
          </button>
        </div>

        {/* ANALYTICS */}
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-3xl p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Total Customers
            </p>

            <h2 className="text-3xl font-black mt-2">
              {
                analytics.total
              }
            </h2>
          </div>

          <div className="bg-white rounded-3xl p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Active
            </p>

            <h2 className="text-3xl font-black mt-2 text-green-600">
              {
                analytics.active
              }
            </h2>
          </div>

          <div className="bg-white rounded-3xl p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Blocked
            </p>

            <h2 className="text-3xl font-black mt-2 text-red-600">
              {
                analytics.blocked
              }
            </h2>
          </div>
        </div>

        {/* SEARCH */}
        <div className="bg-white rounded-[32px] p-5 shadow-sm mb-8">
          <div className="relative">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />

            <input
              type="text"
              placeholder="Search customers..."
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 outline-none"
            />
          </div>
        </div>

        {/* CUSTOMERS */}
        <div className="space-y-6">
          {filteredCustomers.map(
            (
              customer: any
            ) => (
              <div
                key={
                  customer.id
                }
                className="bg-white rounded-[32px] shadow-sm overflow-hidden"
              >
                {/* TOP */}
                <div className="p-6 border-b flex flex-col lg:flex-row justify-between gap-5">
                  <div className="flex items-center gap-5">
                    {/* IMAGE */}
                    <div className="relative w-20 h-20 rounded-3xl overflow-hidden bg-gray-100">
                      {customer.photoURL ? (
                        <Image
                          src={
                            customer.photoURL
                          }
                          alt={
                            customer.name
                          }
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User />
                        </div>
                      )}
                    </div>

                    {/* INFO */}
                    <div>
                      <h2 className="text-2xl font-black">
                        {
                          customer.name
                        }
                      </h2>

                      <p className="text-gray-500 mt-2">
                        {
                          customer.email
                        }
                      </p>

                      <div className="flex gap-3 mt-3 flex-wrap">
                        <span className="px-4 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                          {
                            customer.role
                          }
                        </span>

                        {customer.isBlocked ? (
                          <span className="px-4 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold">
                            Blocked
                          </span>
                        ) : (
                          <span className="px-4 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                            Active
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* RIGHT */}
                  <div className="text-left lg:text-right">
                    <p className="text-sm text-gray-400">
                      Joined
                    </p>

                    <h2 className="text-lg font-bold mt-2">
                      {formatDate(
                        customer.createdAt
                      )}
                    </h2>

                    <p className="text-sm text-gray-500 mt-3">
                      Orders:{" "}
                      {
                        customer.ordersCount
                      }
                    </p>
                  </div>
                </div>

                {/* TOGGLE */}
                <div className="p-5 border-b bg-gray-50">
                  <button
                    onClick={() =>
                      setExpanded(
                        (
                          prev: any
                        ) => ({
                          ...prev,
                          [
                            customer.id
                          ]:
                            !prev[
                              customer
                                .id
                            ],
                        })
                      )
                    }
                    className="w-full bg-white hover:bg-gray-100 transition-all rounded-2xl px-5 py-4 font-semibold text-left"
                  >
                    {expanded[
                      customer.id
                    ]
                      ? "Hide Customer Details"
                      : "View Customer Details"}
                  </button>
                </div>

                {/* DETAILS */}
                {expanded[
                  customer.id
                ] && (
                  <div className="p-6 grid gap-6">
                    {/* BASIC */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                      <InfoCard
                        icon={
                          <Phone />
                        }
                        title="Phone"
                        value={
                          customer.phone ||
                          "N/A"
                        }
                      />

                      <InfoCard
                        icon={
                          <Mail />
                        }
                        title="Email"
                        value={
                          customer.email ||
                          "N/A"
                        }
                      />

                      <InfoCard
                        icon={
                          <Shield />
                        }
                        title="UID"
                        value={
                          customer.uid ||
                          "N/A"
                        }
                      />

                      <InfoCard
                        icon={
                          <MapPin />
                        }
                        title="City"
                        value={
                          customer
                            .address
                            ?.city ||
                          "N/A"
                        }
                      />
                    </div>

                    {/* ADDRESS */}
                    <div className="bg-gray-50 rounded-3xl p-5">
                      <h2 className="text-xl font-black mb-4">
                        Address
                      </h2>

                      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                        <EditableField
                          label="House"
                          value={
                            customer
                              .address
                              ?.house ||
                            ""
                          }
                          onSave={(
                            value
                          ) =>
                            updateField(
                              customer.id,
                              "address.house",
                              value
                            )
                          }
                        />

                        <EditableField
                          label="Area"
                          value={
                            customer
                              .address
                              ?.area ||
                            ""
                          }
                          onSave={(
                            value
                          ) =>
                            updateField(
                              customer.id,
                              "address.area",
                              value
                            )
                          }
                        />

                        <EditableField
                          label="City"
                          value={
                            customer
                              .address
                              ?.city ||
                            ""
                          }
                          onSave={(
                            value
                          ) =>
                            updateField(
                              customer.id,
                              "address.city",
                              value
                            )
                          }
                        />
                      </div>
                    </div>

                    {/* META */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-3xl p-5">
                        <h2 className="text-xl font-black mb-4">
                          Account
                        </h2>

                        <div className="space-y-3">
                          <p>
                            Created:{" "}
                            {formatDate(
                              customer.createdAt
                            )}
                          </p>

                          <p>
                            Last Login:{" "}
                            {formatDate(
                              customer.lastLogin
                            )}
                          </p>

                          <p>
                            Wishlist:{" "}
                            {customer
                              .wishlist
                              ?.length ||
                              0}
                          </p>

                          <p>
                            Saved Addresses:{" "}
                            {customer
                              .savedAddresses
                              ?.length ||
                              0}
                          </p>
                        </div>
                      </div>

                      {/* ACTIONS */}
                      <div className="bg-gray-50 rounded-3xl p-5">
                        <h2 className="text-xl font-black mb-4">
                          Actions
                        </h2>

                        <div className="flex flex-wrap gap-3">
                          <button
                            onClick={() =>
                              toggleBlock(
                                customer.id,
                                customer.isBlocked
                              )
                            }
                            className={`px-5 py-3 rounded-2xl font-semibold text-white ${
                              customer.isBlocked
                                ? "bg-green-600"
                                : "bg-red-500"
                            }`}
                          >
                            {customer.isBlocked ? (
                              <>
                                <CheckCircle2 className="inline mr-2 w-4 h-4" />
                                Unblock
                              </>
                            ) : (
                              <>
                                <Ban className="inline mr-2 w-4 h-4" />
                                Block
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          )}
        </div>

        {/* EMPTY */}
        {filteredCustomers.length ===
          0 && (
          <div className="bg-white rounded-[32px] p-14 text-center shadow-sm mt-8">
            <h2 className="text-2xl font-bold text-gray-900">
              No Customers
              Found
            </h2>

            <p className="text-gray-500 mt-2">
              Try changing
              filters
            </p>
          </div>
        )}

        {/* LOAD MORE */}
        {hasMore &&
          filteredCustomers.length >
            0 && (
            <div className="flex justify-center mt-10">
              <button
                onClick={
                  loadMore
                }
                disabled={
                  loadingMore
                }
                className="bg-black hover:opacity-90 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all disabled:opacity-60"
              >
                {loadingMore
                  ? "Loading..."
                  : "Load More Customers"}
              </button>
            </div>
          )}
      </div>
    </div>
  );
}

// =========================
// INFO CARD
// =========================

function InfoCard({
  icon,
  title,
  value,
}: any) {
  return (
    <div className="bg-gray-50 rounded-3xl p-5">
      <div className="flex items-center gap-3">
        {icon}

        <p className="text-sm text-gray-500">
          {title}
        </p>
      </div>

      <h2 className="text-lg font-black mt-4 break-all">
        {value}
      </h2>
    </div>
  );
}

// =========================
// EDIT FIELD
// =========================

function EditableField({
  label,
  value,
  onSave,
}: any) {
  const [localValue, setLocalValue] =
    useState(value);

  return (
    <div className="bg-white rounded-2xl p-4">
      <p className="text-sm text-gray-500 mb-3">
        {label}
      </p>

      <input
        value={localValue}
        onChange={(e) =>
          setLocalValue(
            e.target.value
          )
        }
        className="w-full border rounded-2xl px-4 py-3 outline-none"
      />

      <button
        onClick={() =>
          onSave(localValue)
        }
        className="mt-3 bg-black text-white px-4 py-2 rounded-xl text-sm font-semibold"
      >
        Save
      </button>
    </div>
  );
}