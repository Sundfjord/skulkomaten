import { z } from 'zod'

export const PrepPlaceSchema = z.enum(['i', 'på'])

export const ActivitySchema = z.object({
  tekst: z.string().min(1),
})

export const PlaceSchema = z.object({
  navn: z.string().min(1),
  prep: PrepPlaceSchema,
})

export const ActivitiesSchema = z.array(ActivitySchema).min(1)
export const PlacesSchema = z.array(PlaceSchema).min(1)

export const ToneSchema = z.enum(['høflig', 'frekk', 'dramatisk'])

export const TemplatesSchema = z
  .record(ToneSchema, z.array(z.string().min(1)).min(1))
  .refine(
    (templates) =>
      Object.values(templates).every((frames) =>
        frames.every((f) => f.includes('{aktivitet}') && f.includes('{sted}')),
      ),
    { message: 'Every template frame must contain both {aktivitet} and {sted} tokens' },
  )

export type Activity = z.infer<typeof ActivitySchema>
export type Place = z.infer<typeof PlaceSchema>
export type Templates = z.infer<typeof TemplatesSchema>
