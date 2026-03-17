export interface SectionExample {
  id: string
  label: string
  category: 'bento' | 'hero' | 'features' | 'stats' | 'cta'
  html: string
}

export const SECTION_EXAMPLES: SectionExample[] = [
  {
    id: 'bento-three-col',
    label: 'Three column bento grid',
    category: 'bento',
    html: `<div class="bg-gray-50 py-24 sm:py-32">
  <div class="mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8">
    <h2 class="text-center text-base/7 font-semibold text-indigo-600">Deploy faster</h2>
    <p class="mx-auto mt-2 max-w-lg text-balance text-center text-4xl font-semibold tracking-tight text-gray-950 sm:text-5xl">Everything you need to deploy your app</p>
    <div class="mt-10 grid gap-4 sm:mt-16 lg:grid-cols-3 lg:grid-rows-2">
      <div class="relative lg:row-span-2">
        <div class="absolute inset-px rounded-lg bg-white lg:rounded-l-[2rem]"></div>
        <div class="relative flex h-full flex-col overflow-hidden rounded-[calc(theme(borderRadius.lg)+1px)] lg:rounded-l-[calc(2rem+1px)]">
          <div class="px-8 pb-3 pt-8 sm:px-10 sm:pb-0 sm:pt-10">
            <p class="mt-2 text-lg font-medium tracking-tight text-gray-950 max-lg:text-center">Mobile friendly</p>
            <p class="mt-2 max-w-lg text-sm/6 text-gray-600 max-lg:text-center">Anim aute id magna aliqua ad ad non deserunt sunt. Qui irure qui lorem cupidatat commodo.</p>
          </div>
          <div class="relative min-h-[30rem] w-full grow [container-type:inline-size] max-lg:mx-auto max-lg:max-w-sm">
            <div class="absolute inset-x-10 bottom-0 top-10 overflow-hidden rounded-t-[12cqw] border-x-[3cqw] border-t-[3cqw] border-gray-700 bg-gray-900 shadow-2xl">
              <img class="size-full object-cover object-top" src="https://tailwindui.com/plus-assets/img/component-images/bento-03-mobile-friendly.png" alt="" />
            </div>
          </div>
        </div>
        <div class="pointer-events-none absolute inset-px rounded-lg shadow ring-1 ring-black/5 lg:rounded-l-[2rem]"></div>
      </div>
      <div class="relative max-lg:row-start-1">
        <div class="absolute inset-px rounded-lg bg-white max-lg:rounded-t-[2rem]"></div>
        <div class="relative flex h-full flex-col overflow-hidden rounded-[calc(theme(borderRadius.lg)+1px)] max-lg:rounded-t-[calc(2rem+1px)]">
          <div class="px-8 pt-8 sm:px-10 sm:pt-10">
            <p class="mt-2 text-lg font-medium tracking-tight text-gray-950 max-lg:text-center">Performance</p>
            <p class="mt-2 max-w-lg text-sm/6 text-gray-600 max-lg:text-center">Lorem ipsum, dolor sit amet consectetur adipisicing elit maiores impedit.</p>
          </div>
          <div class="flex flex-1 items-center justify-center px-8 max-lg:pb-12 max-lg:pt-10 sm:px-10 lg:pb-2">
            <img class="w-full max-lg:max-w-xs" src="https://tailwindui.com/plus-assets/img/component-images/bento-03-performance.png" alt="" />
          </div>
        </div>
        <div class="pointer-events-none absolute inset-px rounded-lg shadow ring-1 ring-black/5 max-lg:rounded-t-[2rem]"></div>
      </div>
      <div class="relative max-lg:row-start-3 lg:col-start-2 lg:row-start-2">
        <div class="absolute inset-px rounded-lg bg-white"></div>
        <div class="relative flex h-full flex-col overflow-hidden rounded-[calc(theme(borderRadius.lg)+1px)]">
          <div class="px-8 pt-8 sm:px-10 sm:pt-10">
            <p class="mt-2 text-lg font-medium tracking-tight text-gray-950 max-lg:text-center">Security</p>
            <p class="mt-2 max-w-lg text-sm/6 text-gray-600 max-lg:text-center">Morbi viverra dui mi arcu sed. Tellus semper adipiscing suspendisse semper morbi.</p>
          </div>
          <div class="flex flex-1 items-center justify-center max-lg:pb-12 max-lg:pt-10 sm:px-10 lg:pb-2">
            <img class="w-full max-lg:max-w-xs" src="https://tailwindui.com/plus-assets/img/component-images/bento-03-security.png" alt="" />
          </div>
        </div>
        <div class="pointer-events-none absolute inset-px rounded-lg shadow ring-1 ring-black/5"></div>
      </div>
      <div class="relative lg:row-span-2">
        <div class="absolute inset-px rounded-lg bg-white max-lg:rounded-b-[2rem] lg:rounded-r-[2rem]"></div>
        <div class="relative flex h-full flex-col overflow-hidden rounded-[calc(theme(borderRadius.lg)+1px)] max-lg:rounded-b-[calc(2rem+1px)] lg:rounded-r-[calc(2rem+1px)]">
          <div class="px-8 pb-3 pt-8 sm:px-10 sm:pb-0 sm:pt-10">
            <p class="mt-2 text-lg font-medium tracking-tight text-gray-950 max-lg:text-center">Powerful APIs</p>
            <p class="mt-2 max-w-lg text-sm/6 text-gray-600 max-lg:text-center">Sit quis amet rutrum tellus ullamcorper ultricies libero dolor eget sem sodales gravida.</p>
          </div>
          <div class="relative min-h-[30rem] w-full grow">
            <div class="absolute bottom-0 left-10 right-0 top-10 overflow-hidden rounded-tl-xl bg-gray-900 shadow-2xl">
              <div class="flex bg-gray-800/40 ring-1 ring-white/5">
                <div class="-mb-px flex text-sm/6 font-medium text-gray-400">
                  <div class="border-b border-r border-b-white/20 border-r-white/10 bg-white/5 px-4 py-2 text-white">NotificationSetting.jsx</div>
                  <div class="border-r border-gray-600/10 px-4 py-2">App.jsx</div>
                </div>
              </div>
              <div class="px-6 pb-14 pt-6 text-xs text-gray-300 font-mono leading-6">
                <p><span class="text-blue-400">import</span> <span class="text-gray-100">{ useState }</span> <span class="text-blue-400">from</span> <span class="text-green-400">'react'</span></p>
                <p><span class="text-blue-400">import</span> <span class="text-gray-100">{ Switch }</span> <span class="text-blue-400">from</span> <span class="text-green-400">'@headlessui/react'</span></p>
                <p class="mt-4"><span class="text-purple-400">function</span> <span class="text-yellow-300">Example</span><span class="text-gray-100">() {</span></p>
                <p class="pl-4"><span class="text-blue-400">const</span> <span class="text-gray-100">[enabled, setEnabled] =</span> <span class="text-yellow-300">useState</span><span class="text-gray-100">(t</span></p>
                <p class="mt-4 pl-4"><span class="text-blue-400">return</span> <span class="text-gray-100">(</span></p>
                <p class="pl-8"><span class="text-gray-500">&lt;</span><span class="text-red-400">form</span> <span class="text-yellow-300">action</span><span class="text-gray-100">=</span><span class="text-green-400">"/notification-settings"</span><span class="text-gray-500">&gt;</span></p>
                <p class="pl-12"><span class="text-gray-500">&lt;</span><span class="text-red-400">Switch</span> <span class="text-yellow-300">checked</span><span class="text-gray-100">={enabled}</span><span class="text-gray-500">&gt;</span></p>
                <p class="pl-16"><span class="text-gray-500">{</span><span class="text-gray-400">/* ... */</span><span class="text-gray-500">}</span></p>
                <p class="pl-12"><span class="text-gray-500">&lt;/</span><span class="text-red-400">Switch</span><span class="text-gray-500">&gt;</span></p>
                <p class="pl-8"><span class="text-gray-500">&lt;</span><span class="text-red-400">button</span><span class="text-gray-500">&gt;</span><span class="text-gray-100">Submit</span><span class="text-gray-500">&lt;/</span><span class="text-red-400">button</span><span class="text-gray-500">&gt;</span></p>
                <p class="pl-8"><span class="text-gray-500">&lt;/</span><span class="text-red-400">form</span><span class="text-gray-500">&gt;</span></p>
                <p class="pl-4"><span class="text-gray-100">)</span></p>
                <p><span class="text-gray-100">}</span></p>
              </div>
            </div>
          </div>
        </div>
        <div class="pointer-events-none absolute inset-px rounded-lg shadow ring-1 ring-black/5 max-lg:rounded-b-[2rem] lg:rounded-r-[2rem]"></div>
      </div>
    </div>
  </div>
</div>`,
  },
  {
    id: 'hero-centered',
    label: 'Centered hero with CTA',
    category: 'hero',
    html: `<div class="bg-white py-24 sm:py-32">
  <div class="mx-auto max-w-7xl px-6 lg:px-8">
    <div class="mx-auto max-w-2xl text-center">
      <h1 class="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">Deploy to the cloud with confidence</h1>
      <p class="mt-6 text-lg leading-8 text-gray-600">Anim aute id magna aliqua ad ad non deserunt sunt. Qui irure qui lorem cupidatat commodo et labore.</p>
      <div class="mt-10 flex items-center justify-center gap-x-6">
        <a href="#" class="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">Get started</a>
        <a href="#" class="text-sm font-semibold leading-6 text-gray-900">Learn more <span aria-hidden="true">→</span></a>
      </div>
    </div>
  </div>
</div>`,
  },
  {
    id: 'features-3col',
    label: 'Features 3-column grid',
    category: 'features',
    html: `<div class="bg-white py-24 sm:py-32">
  <div class="mx-auto max-w-7xl px-6 lg:px-8">
    <div class="mx-auto max-w-2xl lg:text-center">
      <h2 class="text-base font-semibold leading-7 text-indigo-600">Deploy faster</h2>
      <p class="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Everything you need to deploy your app</p>
      <p class="mt-6 text-lg leading-8 text-gray-600">Quis tellus eget adipiscing convallis sit sit eget aliquet quis. Suspendisse eget egestas a elementum pulvinar et feugiat blandit at.</p>
    </div>
    <div class="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
      <dl class="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
        <div class="relative pl-16">
          <dt class="text-base font-semibold leading-7 text-gray-900">
            <div class="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600">
              <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" /></svg>
            </div>
            Push to deploy
          </dt>
          <dd class="mt-2 text-base leading-7 text-gray-600">Morbi viverra dui mi arcu sed. Tellus semper adipiscing suspendisse semper morbi. Morbi viverra dui mi arcu sed.</dd>
        </div>
        <div class="relative pl-16">
          <dt class="text-base font-semibold leading-7 text-gray-900">
            <div class="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600">
              <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
            </div>
            SSL certificates
          </dt>
          <dd class="mt-2 text-base leading-7 text-gray-600">Sit quis amet rutrum tellus ullamcorper ultricies libero dolor eget. Sem sodales gravida quam turpis enim lacus amet.</dd>
        </div>
        <div class="relative pl-16">
          <dt class="text-base font-semibold leading-7 text-gray-900">
            <div class="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600">
              <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
            </div>
            Simple queues
          </dt>
          <dd class="mt-2 text-base leading-7 text-gray-600">Quisque est vel vulputate cursus. Risus proin diam nunc commodo. Lobortis auctor congue commodo diam neque.</dd>
        </div>
        <div class="relative pl-16">
          <dt class="text-base font-semibold leading-7 text-gray-900">
            <div class="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600">
              <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M7.864 4.243A7.5 7.5 0 0119.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 004.5 10.5a7.464 7.464 0 01-1.15 3.993m1.989 3.559A11.209 11.209 0 008.25 10.5a3.75 3.75 0 117.5 0c0 .527-.021 1.049-.064 1.565M12 10.5a14.94 14.94 0 01-3.6 9.75m6.633-4.596a18.666 18.666 0 01-2.485 5.33" /></svg>
            </div>
            Advanced security
          </dt>
          <dd class="mt-2 text-base leading-7 text-gray-600">Arcu egestas dolor vel iaculis in ipsum mauris. Tincidunt mattis aliquet hac quis. Id hac maecenas ac donec pharetra eget.</dd>
        </div>
      </dl>
    </div>
  </div>
</div>`,
  },
  {
    id: 'stats-simple',
    label: 'Stats with description',
    category: 'stats',
    html: `<div class="bg-white py-24 sm:py-32">
  <div class="mx-auto max-w-7xl px-6 lg:px-8">
    <div class="mx-auto max-w-2xl lg:max-w-none">
      <div class="text-center">
        <h2 class="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Trusted by creators worldwide</h2>
        <p class="mt-4 text-lg leading-8 text-gray-600">Lorem ipsum dolor sit amet consect adipisicing possimus.</p>
      </div>
      <dl class="mt-16 grid grid-cols-1 gap-0.5 overflow-hidden rounded-2xl text-center sm:grid-cols-2 lg:grid-cols-4">
        <div class="flex flex-col bg-gray-400/5 p-8">
          <dt class="text-sm font-semibold leading-6 text-gray-600">Offices worldwide</dt>
          <dd class="order-first text-3xl font-semibold tracking-tight text-gray-900">12</dd>
        </div>
        <div class="flex flex-col bg-gray-400/5 p-8">
          <dt class="text-sm font-semibold leading-6 text-gray-600">Full-time colleagues</dt>
          <dd class="order-first text-3xl font-semibold tracking-tight text-gray-900">300+</dd>
        </div>
        <div class="flex flex-col bg-gray-400/5 p-8">
          <dt class="text-sm font-semibold leading-6 text-gray-600">Hours per week</dt>
          <dd class="order-first text-3xl font-semibold tracking-tight text-gray-900">40</dd>
        </div>
        <div class="flex flex-col bg-gray-400/5 p-8">
          <dt class="text-sm font-semibold leading-6 text-gray-600">Paid time off</dt>
          <dd class="order-first text-3xl font-semibold tracking-tight text-gray-900">Unlimited</dd>
        </div>
      </dl>
    </div>
  </div>
</div>`,
  },
  {
    id: 'cta-simple',
    label: 'CTA section',
    category: 'cta',
    html: `<div class="bg-white">
  <div class="mx-auto max-w-7xl py-24 sm:px-6 sm:py-32 lg:px-8">
    <div class="relative isolate overflow-hidden bg-gray-900 px-6 pt-16 shadow-2xl sm:rounded-3xl sm:px-16 md:pt-24 lg:flex lg:gap-x-20 lg:px-24 lg:pt-0">
      <svg viewBox="0 0 1024 1024" class="absolute left-1/2 top-1/2 -z-10 h-[64rem] w-[64rem] -translate-y-1/2 [mask-image:radial-gradient(closest-side,white,transparent)] sm:left-full sm:-ml-80 lg:left-1/2 lg:ml-0 lg:-translate-x-1/2 lg:translate-y-[-30%]" aria-hidden="true"><circle cx="512" cy="512" r="512" fill="url(#759c1415-0410-454c-8f7c-9a820de03641)" fill-opacity="0.7" /><defs><radialGradient id="759c1415-0410-454c-8f7c-9a820de03641"><stop stop-color="#7775D6" /><stop offset="1" stop-color="#E935C1" /></radialGradient></defs></svg>
      <div class="mx-auto max-w-md text-center lg:mx-0 lg:flex-auto lg:py-32 lg:text-left">
        <h2 class="text-3xl font-bold tracking-tight text-white sm:text-4xl">Boost your productivity. Start using our app today.</h2>
        <p class="mt-6 text-lg leading-8 text-gray-300">Ac euismod vel sit maecenas id pellentesque eu sed consectetur. Malesuada adipiscing sagittis vel nulla.</p>
        <div class="mt-10 flex items-center justify-center gap-x-6 lg:justify-start">
          <a href="#" class="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">Get started</a>
          <a href="#" class="text-sm font-semibold leading-6 text-white">Learn more <span aria-hidden="true">→</span></a>
        </div>
      </div>
    </div>
  </div>
</div>`,
  },
]

export const EXAMPLE_CATEGORIES = [
  { id: 'bento',    label: 'Bento Grid' },
  { id: 'hero',     label: 'Hero' },
  { id: 'features', label: 'Features' },
  { id: 'stats',    label: 'Stats' },
  { id: 'cta',      label: 'CTA' },
] as const
