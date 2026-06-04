import { notFound } from "next/navigation";
import { ArrowLeft, BadgeCheck, Clock3, ShieldCheck } from "lucide-react";
import { catalogService } from "@/modules/services/catalog.service";
import { getPublicStartingPrice, getPriceTiersForService } from "@/modules/services/pricing.service";
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

  const priceTiers = getPriceTiersForService(service);

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
            Choose a fixed OttoMob package. We route orders to selected
            guaranteed supplier services that are marked as recommended.
          </p>

          <div className="serviceStats">
            <article>
              <strong>${getPublicStartingPrice(service).toFixed(2)}</strong>
              <span>starting price</span>
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

          {priceTiers.length > 0 && (
            <div className="packagePreview">
              {priceTiers.map((tier) => (
                <span key={tier.quantity}>
                  {tier.label}: ${tier.price.toFixed(2)}
                </span>
              ))}
            </div>
          )}

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
