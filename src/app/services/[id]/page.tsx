import { notFound } from "next/navigation";
import { ArrowLeft, BadgeCheck, Clock3, ShieldCheck } from "lucide-react";
import { catalogService } from "@/modules/services/catalog.service";
import { OrderForm } from "./OrderForm";

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const serviceId = Number(id);

  if (!Number.isInteger(serviceId)) {
    notFound();
  }

  const service = await catalogService.findById(serviceId);

  if (!service) {
    notFound();
  }

  return (
    <main className="serviceDetailPage">
      <section className="serviceDetailHeader">
        <a className="backLink" href="/">
          <ArrowLeft size={20} />
          All Services
        </a>
        <a className="brand" href="/">
          <span className="brandMark" aria-hidden="true">
            {Array.from({ length: 18 }).map((_, index) => (
              <i key={index} />
            ))}
          </span>
          <span>OttoMob</span>
        </a>
      </section>

      <section className="serviceDetailShell">
        <div className="serviceDetailInfo">
          <p className="eyebrow">{service.platform}</p>
          <h1>{service.name}</h1>
          <p>
            Create a local pending order first. Payment, balance deduction, and
            supplier submission will be connected in the next stage.
          </p>

          <div className="serviceStats">
            <article>
              <strong>${service.rate.toFixed(4)}</strong>
              <span>per 1,000 units</span>
            </article>
            <article>
              <strong>{service.minQuantity}</strong>
              <span>minimum order</span>
            </article>
            <article>
              <strong>{service.quantityStep}</strong>
              <span>quantity step</span>
            </article>
          </div>

          <div className="serviceTrustList">
            <span>
              <ShieldCheck size={20} />
              Password is not required
            </span>
            <span>
              <Clock3 size={20} />
              Timing depends on selected service
            </span>
            <span>
              <BadgeCheck size={20} />
              Refill: {service.refillSupported ? "Available" : "Not listed"}
            </span>
          </div>
        </div>

        <div className="orderCard">
          <h2>Order details</h2>
          <OrderForm service={service} />
        </div>
      </section>
    </main>
  );
}
