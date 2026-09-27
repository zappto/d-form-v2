import { afterEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import SearchableSelect from '../SearchableSelect.vue'
import type { SearchableSelectOption } from '../SearchableSelect.vue'

const BASIC_OPTIONS: SearchableSelectOption[] = [
  { value: 'ayu', label: 'Ayu Lestari', sublabel: 'ayu@example.com' },
  { value: 'budi', label: 'Budi Santoso', sublabel: 'budi@example.com' },
  { value: 'citra', label: 'Citra Dewi', sublabel: 'citra@example.com' },
]

const mountedWrappers: VueWrapper[] = []

type TSelectOverrides = {
  modelValue?: string
  options?: SearchableSelectOption[]
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  disabled?: boolean
  required?: boolean
  invalid?: boolean
}

function mountSelect(overrides: TSelectOverrides = {}): VueWrapper {
  const wrapper = mount(SearchableSelect, {
    props: {
      modelValue: '',
      options: BASIC_OPTIONS,
      ...overrides,
    },
    attachTo: document.body,
  })
  mountedWrappers.push(wrapper)
  return wrapper
}

async function settle(): Promise<void> {
  await nextTick()
  await nextTick()
  await nextTick()
}

async function openSelect(wrapper: VueWrapper): Promise<void> {
  await wrapper.find('button[role="combobox"]').trigger('click')
  await settle()
}

function optionButtons(): HTMLButtonElement[] {
  return Array.from(document.body.querySelectorAll<HTMLButtonElement>('button[role="option"]'))
}

function listbox(): HTMLElement | null {
  return document.body.querySelector<HTMLElement>('[role="listbox"]')
}

function setSearch(value: string): void {
  const input = document.body.querySelector<HTMLInputElement>('input[role="searchbox"]')
  if (input === null) throw new Error('searchbox tidak dirender')
  input.value = value
  input.dispatchEvent(new Event('input'))
}

afterEach(() => {
  mountedWrappers.splice(0).forEach((wrapper) => wrapper.unmount())
  document.body.innerHTML = ''
})

describe('SearchableSelect', () => {
  it('membuka popover saat trigger diklik dan emit update:modelValue saat opsi dipilih', async () => {
    const wrapper = mountSelect()
    expect(listbox()).toBeNull()

    await openSelect(wrapper)
    expect(listbox()).not.toBeNull()
    expect(optionButtons()).toHaveLength(3)

    optionButtons()[1]?.click()
    await settle()
    expect(wrapper.emitted('update:modelValue')).toEqual([['budi']])
    expect(listbox()).toBeNull()
  })

  it('memfilter opsi berdasarkan label', async () => {
    const wrapper = mountSelect()
    await openSelect(wrapper)

    setSearch('budi')
    await settle()

    expect(optionButtons()).toHaveLength(1)
    expect(optionButtons()[0]?.textContent).toContain('Budi Santoso')
  })

  it('memfilter opsi berdasarkan sublabel', async () => {
    const wrapper = mountSelect()
    await openSelect(wrapper)

    setSearch('citra@')
    await settle()

    expect(optionButtons()).toHaveLength(1)
    expect(optionButtons()[0]?.textContent).toContain('Citra Dewi')
  })

  it('menampilkan emptyText saat tidak ada opsi yang cocok', async () => {
    const wrapper = mountSelect({ emptyText: 'Tidak ada kandidat' })
    await openSelect(wrapper)

    setSearch('zzz')
    await settle()

    expect(optionButtons()).toHaveLength(0)
    expect(listbox()?.textContent).toContain('Tidak ada kandidat')
  })

  it('tidak membuka popover saat disabled', async () => {
    const wrapper = mountSelect({ disabled: true })
    const trigger = wrapper.find('button[role="combobox"]')
    expect(trigger.attributes('disabled')).toBeDefined()

    await openSelect(wrapper)

    expect(listbox()).toBeNull()
  })

  it('meneruskan required dan invalid ke atribut trigger', async () => {
    const wrapper = mountSelect({ required: true, invalid: true })
    const trigger = wrapper.find('button[role="combobox"]')

    expect(trigger.attributes('required')).toBeDefined()
    expect(trigger.attributes('aria-required')).toBe('true')
    expect(trigger.attributes('aria-invalid')).toBe('true')
  })

  it('tidak merender atribut required/invalid saat default', async () => {
    const wrapper = mountSelect()
    const trigger = wrapper.find('button[role="combobox"]')

    expect(trigger.attributes('required')).toBeUndefined()
    expect(trigger.attributes('aria-required')).toBeUndefined()
    expect(trigger.attributes('aria-invalid')).toBeUndefined()
  })

  it('tidak merender avatar pada trigger saat opsi tanpa initials (guard filter select)', async () => {
    const wrapper = mountSelect({ modelValue: 'ayu' })
    const trigger = wrapper.find('button[role="combobox"]')

    expect(trigger.text()).toContain('Ayu Lestari')
    expect(trigger.find('span.rounded-full').exists()).toBe(false)
  })

  it('merender avatar pada trigger saat initials diberikan', async () => {
    const wrapper = mountSelect({
      modelValue: 'ayu',
      options: [{ value: 'ayu', label: 'Ayu Lestari', initials: 'AL' }],
    })
    const avatar = wrapper.find('button[role="combobox"] span.rounded-full')

    expect(avatar.exists()).toBe(true)
    expect(avatar.text()).toBe('AL')
  })

  it('tidak merender avatar pada baris opsi saat tanpa initials', async () => {
    const wrapper = mountSelect()
    await openSelect(wrapper)

    expect(optionButtons()[0]?.querySelector('span.rounded-full')).toBeNull()
  })

  it('merender avatar pada baris opsi saat initials diberikan', async () => {
    const wrapper = mountSelect({
      options: [{ value: 'ayu', label: 'Ayu Lestari', initials: 'AL' }],
    })
    await openSelect(wrapper)

    const avatar = optionButtons()[0]?.querySelector('span.rounded-full')
    expect(avatar?.textContent?.trim()).toBe('AL')
  })

  it('merender img thumbnail pada baris opsi saat imageSrc diberikan', async () => {
    const wrapper = mountSelect({
      options: [{ value: 'ayu', label: 'Ayu Lestari', imageSrc: '/storage/ayu.png' }],
    })
    await openSelect(wrapper)

    const image = optionButtons()[0]?.querySelector('img')
    expect(image).not.toBeNull()
    expect(image?.getAttribute('src')).toBe('/storage/ayu.png')
    expect(image?.getAttribute('loading')).toBe('lazy')
    expect(image?.getAttribute('alt')).toBe('')
  })

  it('merender img thumbnail pada trigger untuk opsi terpilih', async () => {
    const wrapper = mountSelect({
      modelValue: 'ayu',
      options: [{ value: 'ayu', label: 'Ayu Lestari', imageSrc: '/storage/ayu.png' }],
    })
    const image = wrapper.find('button[role="combobox"] img')

    expect(image.exists()).toBe(true)
    expect(image.attributes('src')).toBe('/storage/ayu.png')
  })

  it('thumbnail menang atas initials saat keduanya tersedia', async () => {
    const wrapper = mountSelect({
      modelValue: 'ayu',
      options: [{ value: 'ayu', label: 'Ayu Lestari', initials: 'AL', imageSrc: '/storage/ayu.png' }],
    })
    const trigger = wrapper.find('button[role="combobox"]')

    expect(trigger.find('img').exists()).toBe(true)
    expect(trigger.find('span.rounded-full').exists()).toBe(false)
  })
})
