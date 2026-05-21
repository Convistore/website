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

import { auth, db } from "@/lib/firebase";

import {
  onAuthStateChanged,
} from "firebase/auth";

import { useRouter } from "next/navigation";

import {
  Search,
  RefreshCcw,
  Package,
  MapPin,
  Clock3,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";

// =========================
// FORMAT DATE
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

export default function ProductRequestsPage() {
  const router = useRouter();

  const [authorized, setAuthorized] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [requests, setRequests] =
    useState<any[]>([]);

  const [filteredRequests, setFilteredRequests] =
    useState<any[]>([]);

  const [expanded, setExpanded] =
    useState<any>({});

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("All");

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

            const adminRef = doc(
              db,
              "admins",
              user.uid
            );

            const adminSnap =
              await getDoc(adminRef);

            if (
              !adminSnap.exists()
            ) {
              router.push("/");

              return;
            }

            const adminData =
              adminSnap.data();

            if (
              adminData.role !==
              "admin"
            ) {
              router.push("/");

              return;
            }

            setAuthorized(true);

            fetchRequests();
          } catch (error) {
            console.error(error);

            router.push("/");
          }
        }
      );

    return () => unsubscribe();
  }, []);

  // =========================
  // FETCH REQUESTS
  // =========================

  const fetchRequests =
    useCallback(async () => {
      try {
        setLoading(true);

        const requestsQuery =
          query(
            collection(
              db,
              "productRequests"
            ),
            orderBy(
              "createdAt",
              "desc"
            ),
            limit(20)
          );

        const snapshot =
          await getDocs(
            requestsQuery
          );

        const data =
          snapshot.docs.map(
            (doc) => ({
              id: doc.id,
              ...doc.data(),
            })
          );

        setRequests(data);

        setFilteredRequests(
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
              "productRequests"
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

        const newRequests =
          snapshot.docs.map(
            (doc) => ({
              id: doc.id,
              ...doc.data(),
            })
          );

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

        setRequests((prev) => [
          ...prev,
          ...newRequests,
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
      ...requests,
    ];

    // SEARCH
    if (search) {
      updated =
        updated.filter(
          (request) =>
            request.productName
              ?.toLowerCase()
              .includes(
                search.toLowerCase()
              ) ||
            request.location
              ?.toLowerCase()
              .includes(
                search.toLowerCase()
              ) ||
            request.category
              ?.toLowerCase()
              .includes(
                search.toLowerCase()
              )
        );
    }

    // STATUS
    if (
      statusFilter !== "All"
    ) {
      updated =
        updated.filter(
          (request) =>
            request.status ===
            statusFilter
        );
    }

    setFilteredRequests(
      updated
    );
  }, [
    requests,
    search,
    statusFilter,
  ]);

  // =========================
  // UPDATE STATUS
  // =========================

  const updateStatus =
    async (
      requestId: string,
      status: string
    ) => {
      try {
        await updateDoc(
          doc(
            db,
            "productRequests",
            requestId
          ),
          {
            status,
          }
        );

        setRequests((prev) =>
          prev.map(
            (request) => {
              if (
                request.id ===
                requestId
              ) {
                return {
                  ...request,
                  status,
                };
              }

              return request;
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
          requests.length,

        pending:
          requests.filter(
            (r) =>
              r.status ===
              "pending"
          ).length,

        approved:
          requests.filter(
            (r) =>
              r.status ===
              "approved"
          ).length,

        rejected:
          requests.filter(
            (r) =>
              r.status ===
              "rejected"
          ).length,
      };
    }, [requests]);

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
              Product Requests
            </h1>

            <p className="text-gray-500 mt-2 text-lg">
              Manage customer
              product requests
            </p>
          </div>

          <button
            onClick={
              fetchRequests
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
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          <AnalyticsCard
            title="Total Requests"
            value={
              analytics.total
            }
            color="text-black"
          />

          <AnalyticsCard
            title="Pending"
            value={
              analytics.pending
            }
            color="text-yellow-600"
          />

          <AnalyticsCard
            title="Approved"
            value={
              analytics.approved
            }
            color="text-green-600"
          />

          <AnalyticsCard
            title="Rejected"
            value={
              analytics.rejected
            }
            color="text-red-600"
          />
        </div>

        {/* FILTERS */}
        <div className="bg-white rounded-[32px] p-5 shadow-sm mb-8">
          <div className="flex flex-col xl:flex-row gap-4">
            {/* SEARCH */}
            <div className="relative flex-1">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />

              <input
                type="text"
                placeholder="Search requests..."
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 outline-none"
              />
            </div>

            {/* STATUS */}
            <select
              value={
                statusFilter
              }
              onChange={(e) =>
                setStatusFilter(
                  e.target.value
                )
              }
              className="px-5 py-4 rounded-2xl border border-gray-200 outline-none bg-white"
            >
              <option value="All">
                All Status
              </option>

              <option value="pending">
                Pending
              </option>

              <option value="approved">
                Approved
              </option>

              <option value="rejected">
                Rejected
              </option>
            </select>
          </div>
        </div>

        {/* REQUESTS */}
        <div className="space-y-6">
          {filteredRequests.map(
            (request: any) => (
              <div
                key={request.id}
                className="bg-white rounded-[32px] shadow-sm overflow-hidden"
              >
                {/* TOP */}
                <div className="p-6 border-b flex flex-col lg:flex-row justify-between gap-5">
                  <div className="flex items-center gap-5">
                    <div className="w-20 h-20 rounded-3xl bg-gray-100 flex items-center justify-center">
                      <Package
                        size={34}
                      />
                    </div>

                    <div>
                      <h2 className="text-2xl font-black">
                        {
                          request.productName
                        }
                      </h2>

                      <p className="text-gray-500 mt-2">
                        {
                          request.category
                        }
                      </p>

                      <div className="flex gap-3 mt-3 flex-wrap">
                        <span
                          className={`px-4 py-1 rounded-full text-xs font-bold ${
                            request.status ===
                            "approved"
                              ? "bg-green-100 text-green-700"
                              : request.status ===
                                "rejected"
                              ? "bg-red-100 text-red-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {
                            request.status
                          }
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT */}
                  <div className="text-left lg:text-right">
                    <p className="text-sm text-gray-400">
                      Requested At
                    </p>

                    <h2 className="text-lg font-bold mt-2">
                      {formatDate(
                        request.createdAt
                      )}
                    </h2>
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
                            request.id
                          ]:
                            !prev[
                              request
                                .id
                            ],
                        })
                      )
                    }
                    className="w-full bg-white hover:bg-gray-100 transition-all rounded-2xl px-5 py-4 font-semibold text-left"
                  >
                    {expanded[
                      request.id
                    ]
                      ? "Hide Request Details"
                      : "View Request Details"}
                  </button>
                </div>

                {/* DETAILS */}
                {expanded[
                  request.id
                ] && (
                  <div className="p-6 grid gap-6">
                    {/* INFO */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      <InfoCard
                        icon={
                          <Package />
                        }
                        title="Product"
                        value={
                          request.productName
                        }
                      />

                      <InfoCard
                        icon={
                          <MapPin />
                        }
                        title="Location"
                        value={
                          request.location
                        }
                      />

                      <InfoCard
                        icon={
                          <Clock3 />
                        }
                        title="Status"
                        value={
                          request.status
                        }
                      />
                    </div>

                    {/* DESCRIPTION */}
                    <div className="bg-gray-50 rounded-3xl p-5">
                      <h2 className="text-xl font-black mb-4">
                        Description
                      </h2>

                      <p className="text-gray-700 leading-relaxed">
                        {request.description ||
                          "No description provided"}
                      </p>
                    </div>

                    {/* ACTIONS */}
                    <div className="bg-gray-50 rounded-3xl p-5">
                      <h2 className="text-xl font-black mb-4">
                        Actions
                      </h2>

                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={() =>
                            updateStatus(
                              request.id,
                              "approved"
                            )
                          }
                          className="bg-green-600 text-white px-5 py-3 rounded-2xl font-semibold"
                        >
                          <CheckCircle2 className="inline mr-2 w-4 h-4" />
                          Approve
                        </button>

                        <button
                          onClick={() =>
                            updateStatus(
                              request.id,
                              "rejected"
                            )
                          }
                          className="bg-red-500 text-white px-5 py-3 rounded-2xl font-semibold"
                        >
                          <XCircle className="inline mr-2 w-4 h-4" />
                          Reject
                        </button>

                        <button
                          onClick={() =>
                            updateStatus(
                              request.id,
                              "pending"
                            )
                          }
                          className="bg-yellow-500 text-white px-5 py-3 rounded-2xl font-semibold"
                        >
                          <AlertCircle className="inline mr-2 w-4 h-4" />
                          Pending
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          )}
        </div>

        {/* EMPTY */}
        {filteredRequests.length ===
          0 && (
          <div className="bg-white rounded-[32px] p-14 text-center shadow-sm mt-8">
            <h2 className="text-2xl font-bold text-gray-900">
              No Product
              Requests Found
            </h2>

            <p className="text-gray-500 mt-2">
              Try changing
              filters
            </p>
          </div>
        )}

        {/* LOAD MORE */}
        {hasMore &&
          filteredRequests.length >
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
                  : "Load More Requests"}
              </button>
            </div>
          )}
      </div>
    </div>
  );
}

// =========================
// ANALYTICS CARD
// =========================

function AnalyticsCard({
  title,
  value,
  color,
}: any) {
  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm">
      <p className="text-sm text-gray-500">
        {title}
      </p>

      <h2
        className={`text-3xl font-black mt-2 ${color}`}
      >
        {value}
      </h2>
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

      <h2 className="text-lg font-black mt-4 break-all capitalize">
        {value}
      </h2>
    </div>
  );
}